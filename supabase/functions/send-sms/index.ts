// @ts-nocheck
// supabase/functions/send-sms/index.ts
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const YOOLA_API_KEY = Deno.env.get("YOOLA_API_KEY")!;
const YOOLA_SENDER = Deno.env.get("YOOLA_SENDER") ?? "Munolink";
const SEND_SMS_HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  let phone: string | null = null;
  let message: string | null = null;

  // Detect Supabase webhook (has signature header) vs legacy direct call
  const sigHeader =
    req.headers.get("webhook-signature") ??
    req.headers.get("x-supabase-signature");

  if (sigHeader) {
    // Supabase Send SMS Hook path
    try {
      const wh = new Webhook(SEND_SMS_HOOK_SECRET.replace("v1,whsec_", ""));
      const payload = wh.verify(rawBody, Object.fromEntries(req.headers)) as {
        user: { phone: string };
        sms: { otp: string };
      };
      phone = payload.user.phone;
      message = `Your Munolink verification code is: ${payload.sms.otp}`;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // Legacy direct call path (your otp.service.ts)
    try {
      const body = JSON.parse(rawBody);
      phone = body.phone;
      message = body.message;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!phone || !message) {
    return new Response(JSON.stringify({ error: "Missing phone or message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Call Yoola exactly as before
  try {
    const yoolaResp = await fetch("https://yoolasms.com/api/v1/send.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        message,
        api_key: YOOLA_API_KEY,
        sender: YOOLA_SENDER,
      }),
    });

    const result = await yoolaResp.json();
    console.log("Yoola response:", result);

    if (result.status === "success") {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: result.message ?? "Yoola failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});