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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, payload } = await req.json()

    if (action === 'verify_member') {
      const { name, id_num } = payload

      if (!id_num || !/^\d{4}-\d{4}$/.test(id_num)) {
        return new Response(JSON.stringify({ error: 'ID Number must be in XXXX-XXXX format' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          department:dept_id(name),
          credits:credits(wfh_credits)
        `)
        .eq('name', name)
        .eq('id_num', id_num)
        .single()

      if (error || !data) {
        return new Response(JSON.stringify({ error: 'Member not found or data mismatch' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'submit_wfh_request') {
      const { member_id, date } = payload

      const { data, error } = await supabase
        .from('wfhrequest')
        .insert({
          member_id,
          date_requested: date,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
