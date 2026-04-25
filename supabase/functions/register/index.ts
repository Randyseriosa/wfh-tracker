import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
            return new Response(JSON.stringify({
                error: 'Server configuration error: Missing environment variables'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Initialize Supabase client with Service Role Key to bypass RLS
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

        console.log('Received registration request:', { ...body, password: '***' })
        const { name, username, password, role, code, dept_id, supervisor_id, id_num } = body

        if (!name || !role || !code) {
            return new Response(JSON.stringify({
                error: 'Missing required fields',
                received: { name: !!name, role: !!role, code: !!code }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Username and password required for non-member roles
        if (role !== 'member' && (!username || !password)) {
            return new Response(JSON.stringify({
                error: 'Username and password are required for this role'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Additional validation for member/supervisor
        if (role === 'supervisor' && !dept_id) {
            return new Response(JSON.stringify({ error: 'Department is required for supervisors' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        if (role === 'member') {
            if (!dept_id || !supervisor_id || !id_num) {
                return new Response(JSON.stringify({ error: 'Department, Supervisor, and ID Number are required for members' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            if (!/^\d{4}-\d{4}$/.test(id_num)) {
                return new Response(JSON.stringify({ error: 'ID Number must be in XXXX-XXXX format' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        // 1. Validate Code
        console.log('Validating code:', code)
        const { data: codeData, error: codeError } = await supabase
            .from('code')
            .select('codex')
            .eq('codex', code)
            .maybeSingle()

        if (codeError) {
            console.error('Error checking code:', codeError)
            return new Response(JSON.stringify({ error: `Database error checking code: ${codeError.message}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (!codeData) {
            return new Response(JSON.stringify({ error: 'Invalid invitation code' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Check if username already exists in profile (only for non-members)
        if (role !== 'member') {
            console.log('Checking username:', username)
            const { data: existingProfile, error: profileCheckError } = await supabase
                .from('profile')
                .select('username')
                .eq('username', username)
                .maybeSingle()

            if (profileCheckError) {
                console.error('Error checking profile:', profileCheckError)
                return new Response(JSON.stringify({ error: `Database error checking username: ${profileCheckError.message}` }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            if (existingProfile) {
                return new Response(JSON.stringify({ error: 'Username already taken' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        // 3. Create User and Profile (ONLY for non-members)
        let userId: string | null = null;
        if (role !== 'member') {
            const email = `${username!.trim()}@wfh.tracker`.toLowerCase()
            console.log('Creating user with email:', email)

            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                email,
                password: password!,
                email_confirm: true,
                user_metadata: { name, role }
            })

            if (userError) {
                console.error('Error creating user:', userError)
                return new Response(JSON.stringify({ error: userError.message }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            userId = userData.user.id;

            // 4. Create Profile
            console.log('Creating profile for user:', userId)
            const profileInsert: any = {
                id: userId,
                name,
                username: username!.trim(),
                role
            }
            if (dept_id) profileInsert.dept_id = dept_id

            const { error: profileError } = await supabase
                .from('profile')
                .insert(profileInsert)

            if (profileError) {
                console.error('Error creating profile:', profileError)
                // Cleanup user if profile creation fails
                await supabase.auth.admin.deleteUser(userId)
                return new Response(JSON.stringify({ error: `Profile creation failed: ${profileError.message}` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
        }

        // 5. If role is member, create member record and initial credits
        if (role === 'member') {
            console.log('Creating member record for:', name)

            // Fetch supervisor's default credits
            const { data: setting } = await supabase
                .from('settings')
                .select('wfh_credits')
                .eq('name', 'default-credits')
                .eq('supervisor_id', supervisor_id)
                .maybeSingle()

            const initialCredits = setting?.wfh_credits ?? 0

            const memberInsert: any = {
                id_num,
                name,
                dept_id,
                supervisor_id
            }
            if (userId) memberInsert.id = userId;

            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .insert(memberInsert)
                .select()
                .single()

            if (memberError) {
                console.error('Error creating member record:', memberError)
                // Note: If role was not member, we already created auth user/profile. 
                // In current flow, if role is member, userId is null.
                return new Response(JSON.stringify({ error: `Member creation failed: ${memberError.message}` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            } else {
                // Initialize credits
                await supabase
                    .from('credits')
                    .insert({
                        member_id: memberData.id,
                        wfh_credits: initialCredits
                    })
            }
        }

        console.log('Registration successful for:', role === 'member' ? name : username)
        return new Response(JSON.stringify({
            message: 'User registered successfully',
            user: {
                id: userId || 'member-only',
                role
            }
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error('Unexpected error:', error)
        return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
