// Follow this setup to deploy:
// 1. supabase functions new push-notifications
// 2. Overwrite supabase/functions/push-notifications/index.ts with this content
// 3. supabase functions deploy push-notifications
// NOTE: Removed --no-verify-jwt for security. Function now requires authentication.

import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Push notifications function started")

Deno.serve(async (req) => {
    try {
        // ============================================================
        // SECURITY: Verify JWT Authentication
        // ============================================================

        // 1. Check for Authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Missing Authorization header')
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Initialize Supabase Client with auth context
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader }
                }
            }
        )

        // 3. Verify user is authenticated
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error('Authentication failed:', authError?.message)
            return new Response(
                JSON.stringify({ error: 'Unauthorized - invalid or expired token' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // ============================================================
        // Process notification
        // ============================================================

        const { record } = await req.json()

        // Check if this is an insert to 'notifications'
        if (!record || !record.user_id) {
            return new Response(
                JSON.stringify({ error: 'No user_id in record' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // SECURITY: Prevent user spoofing
        // Only allow sending notifications to the authenticated user
        // (or use service role for system notifications)
        if (record.user_id !== user.id && user.role !== 'service_role') {
            console.error(`User ${user.id} attempted to send notification to ${record.user_id}`)
            return new Response(
                JSON.stringify({ error: 'Forbidden - cannot send notifications for other users' }),
                {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // Initialize Supabase Client with service role for user data access
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get the target user's push token
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('push_token')
            .eq('id', record.user_id)
            .single()

        if (userError || !targetUser || !targetUser.push_token) {
            console.log(`No push token for user ${record.user_id}`)
            return new Response(
                JSON.stringify({ message: 'No push token found' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Fetch actor name (sender) for the notification body
        let body = "You have a new notification";
        if (record.actor_id) {
            const { data: actor } = await supabase.from('users').select('nickname, is_anonymous').eq('id', record.actor_id).single();
            const name = actor?.is_anonymous ? "Someone" : (actor?.nickname || "Someone");

            if (record.type === 'message') {
                body = `${name} sent you a message`;
            } else if (record.type === 'comment') {
                body = `${name} commented on your post`;
            }
        }

        // 3. Send to Expo
        const message = {
            to: targetUser.push_token,
            sound: 'default',
            title: 'Hearsay',
            body: body,
            data: { url: `yikyak://notifications` },
        };

        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const data = await res.json()
        console.log(data)

        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
})
