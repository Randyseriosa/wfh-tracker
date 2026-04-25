import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, payload } = await req.json()

        if (action === 'verify_member') {
            const { dept_id, supervisor_id, id_num } = payload

            if (!id_num || !/^\d{4}-\d{4}$/.test(id_num)) {
                return new Response(JSON.stringify({ error: 'ID Number must be in XXXX-XXXX format' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                })
            }

            const { data, error } = await supabaseClient
                .from('members')
                .select('id, name')
                .eq('dept_id', dept_id)
                .eq('supervisor_id', supervisor_id)
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

        if (action === 'submit_request') {
            const { member_id, date } = payload

            if (!member_id || !date) {
                return new Response(JSON.stringify({ error: 'Member ID and date are required' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                })
            }

            const { data, error } = await supabaseClient
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

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
