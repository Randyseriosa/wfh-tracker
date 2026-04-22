import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })

    const body = await req.json().catch(() => null)
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, payload } = body

    // 1. Add Member (Supervisor/Admin)
    if (action === 'add_member') {
      const { id_num, name, dept_id, supervisor_id, initial_credits } = payload

      if (!id_num || !/^\d{4}-\d{4}$/.test(id_num)) {
        throw new Error('ID Number must be in XXXX-XXXX format')
      }

      // Fetch supervisor's default credits if initial_credits is not provided
      let creditsToApply = initial_credits
      if (creditsToApply === undefined || creditsToApply === null) {
        const { data: setting } = await supabase
          .from('settings')
          .select('wfh_credits')
          .eq('name', 'default-credits')
          .eq('supervisor_id', supervisor_id)
          .maybeSingle()

        creditsToApply = setting?.wfh_credits ?? 0
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          id_num,
          name,
          dept_id,
          supervisor_id,
          initial_credits: creditsToApply
        })
        .select()
        .single()

      if (memberError) throw memberError

      // Initialize credits
      const { error: creditError } = await supabase
        .from('credits')
        .insert({
          member_id: member.id,
          wfh_credits: creditsToApply
        })

      if (creditError) throw creditError

      return new Response(JSON.stringify(member), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Update Credits (Supervisor/Admin)
    if (action === 'update_credits') {
      const { member_id, wfh_credits } = payload

      const { data, error } = await supabase
        .from('credits')
        .update({ wfh_credits, updated_at: new Date().toISOString() })
        .eq('member_id', member_id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Approve WFH Request
    if (action === 'approve_wfh_request') {
      const { request_id } = payload

      // Get the request and member_id
      const { data: request, error: reqError } = await supabase
        .from('wfhrequest')
        .select('member_id, status')
        .eq('id', request_id)
        .single()

      if (reqError) throw reqError
      if (request.status === 'approved') throw new Error('Request already approved')

      // Update request status
      const { error: updateError } = await supabase
        .from('wfhrequest')
        .update({ status: 'approved', date_approved: new Date().toISOString() })
        .eq('id', request_id)

      if (updateError) throw updateError

      // Deduct credit
      const { data: currentCredits, error: creditFetchError } = await supabase
        .from('credits')
        .select('wfh_credits')
        .eq('member_id', request.member_id)
        .single()

      if (creditFetchError) throw creditFetchError

      const { error: creditUpdateError } = await supabase
        .from('credits')
        .update({ wfh_credits: Math.max(0, (currentCredits?.wfh_credits || 0) - 1) })
        .eq('member_id', request.member_id)

      if (creditUpdateError) throw creditUpdateError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 4. Add Department (Admin)
    if (action === 'add_department') {
      const { name } = payload
      const { data, error } = await supabase
        .from('department')
        .insert({ name })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 5. Deny WFH Request
    if (action === 'deny_wfh_request') {
      const { request_id } = payload

      const { error: updateError } = await supabase
        .from('wfhrequest')
        .update({ status: 'rejected' })
        .eq('id', request_id)

      if (updateError) throw updateError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 6. Revert WFH Request (Reset to Pending)
    if (action === 'revert_wfh_request') {
      const { request_id } = payload

      // Get the current status and member_id
      const { data: request, error: reqError } = await supabase
        .from('wfhrequest')
        .select('member_id, status')
        .eq('id', request_id)
        .single()

      if (reqError) throw reqError

      // If it was already pending, do nothing
      if (request.status === 'pending') {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Update status back to pending
      const { error: updateError } = await supabase
        .from('wfhrequest')
        .update({ status: 'pending', date_approved: null })
        .eq('id', request_id)

      if (updateError) throw updateError

      // If it was approved, refund the credit
      if (request.status === 'approved') {
        const { data: currentCredits, error: creditFetchError } = await supabase
          .from('credits')
          .select('wfh_credits')
          .eq('member_id', request.member_id)
          .single()

        if (creditFetchError) throw creditFetchError

        const { error: creditUpdateError } = await supabase
          .from('credits')
          .update({ wfh_credits: (currentCredits?.wfh_credits || 0) + 1 })
          .eq('member_id', request.member_id)

        if (creditUpdateError) throw creditUpdateError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 7. Upsert Setting (Supervisor/Admin) - For FUTURE team members
    if (action === 'upsert_setting') {
      const { name, wfh_credits, supervisor_id } = payload

      const { data, error } = await supabase
        .from('settings')
        .upsert(
          { name, wfh_credits, supervisor_id, date: new Date().toISOString().split('T')[0] },
          { onConflict: 'name,supervisor_id' }
        )
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 8. Set Team Credits (Supervisor/Admin) - Updates ALL current team members in 'credits' and 'members' table
    if (action === 'set_team_credits') {
      const { wfh_credits, supervisor_id } = payload

      // 1. Get all members under this supervisor
      const { data: teamMembers, error: membersError } = await supabase
        .from('members')
        .select('id')
        .eq('supervisor_id', supervisor_id)

      if (membersError) throw membersError

      if (teamMembers && teamMembers.length > 0) {
        const memberIds = teamMembers.map(m => m.id)

        // 2. Update initial_credits for all team members (stores in 'members' table)
        const { error: initialUpdateError } = await supabase
          .from('members')
          .update({ initial_credits: wfh_credits })
          .in('id', memberIds)

        if (initialUpdateError) throw initialUpdateError

        // 3. Update current credits for all team members (stores in 'credits' table)
        const { error: creditsUpdateError } = await supabase
          .from('credits')
          .update({ wfh_credits, updated_at: new Date().toISOString() })
          .in('member_id', memberIds)

        if (creditsUpdateError) throw creditsUpdateError
      }

      return new Response(JSON.stringify({ success: true, count: teamMembers?.length ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error: any) {
    const errorMsg = error?.message || 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
