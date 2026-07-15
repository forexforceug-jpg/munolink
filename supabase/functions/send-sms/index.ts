// supabase/functions/send-sms/index.ts
// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// @ts-ignore - Deno environment
const YOOLA_API_KEY = Deno.env.get('YOOLA_API_KEY') || '2aY7x0h5751u1W8GJjG171oQ0m59W9P213ah929vhZIN811HFJokEvnT37WKg69q';
const YOOLA_API_URL = 'https://yoolasms.com/api/v1/send.php';

interface Payload {
  phone: string;
  message: string;
  sender?: string;
}

// @ts-ignore - Deno serve function
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get the request body
    const payload: Payload = await req.json();
    const { phone, message, sender } = payload;

    // Validate input
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone and message are required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`📤 Sending SMS to ${phone}...`);
    console.log(`📝 Message: ${message.substring(0, 50)}...`);

    // Use the default sender ID if no sender provided or if sender is "Munolink"
    // The default allowed sender is "ATInfo"
    const senderToUse = (sender && sender !== 'Munolink') ? sender : 'ATInfo';
    
    console.log(`📤 Using sender ID: ${senderToUse}`);

    // Call Yoola API from the server (no CORS issues!)
    const response = await fetch(YOOLA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        api_key: YOOLA_API_KEY,
        sender: senderToUse,
      }),
    });

    const result = await response.json();

    console.log('📤 Yoola Response:', result);

    // Return the result with CORS headers
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: unknown) {
    console.error('❌ Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
    
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: errorMessage 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});