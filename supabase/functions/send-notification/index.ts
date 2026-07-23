import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { expo_push_token, message, title } = await req.json();

    if (!expo_push_token || !message) {
      return new Response('Missing expo_push_token or message in request body', { status: 400 });
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        // It's recommended to use an Expo Access Token for authentication
        // 'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`
      },
      body: JSON.stringify({
        to: expo_push_token,
        sound: 'default',
        title: title || 'Meralco Mobile',
        body: message,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
});
