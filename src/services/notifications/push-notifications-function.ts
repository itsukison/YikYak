// Follow this setup to deploy:
// 1. supabase functions new push-notifications
// 2. Overwrite supabase/functions/push-notifications/index.ts with this content
// 3. supabase functions deploy push-notifications --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Hello from Functions!")

Deno.serve(async (req) => {
    try {
        const { record } = await req.json()

        // Check if this is an insert to 'notifications'
        if (!record || !record.user_id) {
            return new Response(JSON.stringify({ message: 'No user_id in record' }), { headers: { 'Content-Type': 'application/json' } })
        }

        // Initialize Supabase Client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get the user's push token
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('push_token')
            .eq('id', record.user_id)
            .single()

        if (userError || !user || !user.push_token) {
            console.log(`No push token for user ${record.user_id}`)
            return new Response(JSON.stringify({ message: 'No push token found' }), { headers: { 'Content-Type': 'application/json' } })
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
            to: user.push_token,
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
