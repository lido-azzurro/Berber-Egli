import webPush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:berberegli@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  test?: boolean;
}

async function sendToAllSubscriptions(
  supabase: ReturnType<typeof createClient>,
  payload: NotificationPayload
): Promise<{ sent: number; total: number; errors: string[] }> {
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (error) {
    return { sent: 0, total: 0, errors: [`DB error: ${error.message}`] };
  }

  if (!subs || subs.length === 0) {
    return { sent: 0, total: 0, errors: ["No subscriptions found"] };
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { sent: 0, total: subs.length, errors: ["VAPID keys not configured"] };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag ?? "new-booking",
    test: payload.test ?? false,
  });

  let sentCount = 0;
  const errors: string[] = [];

  for (const sub of subs as PushSubscriptionRow[]) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload,
        {
          TTL: 86400,
          urgency: "high",
        }
      );
      sentCount++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
      errors.push(`endpoint ${sub.endpoint.slice(-20)}: ${status ?? "unknown"}`);
    }
  }

  return { sent: sentCount, total: subs.length, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ vapidPublicKey: VAPID_PUBLIC_KEY }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const isTest = body.test === true;

    let payload: NotificationPayload;

    if (isTest) {
      payload = {
        title: "Test Njoftim",
        body: "Ky është një test push notification nga Berber Egli.",
        url: "/",
        tag: "test-push",
        test: true,
      };
    } else {
      const { clientName, slotTime, bookingDate, service } = body;
      payload = {
        title: "Rezervim i Ri!",
        body: `${clientName} — ${bookingDate} ora ${slotTime}${service ? ` · ${service}` : ""}`,
        url: "/",
        tag: "new-booking",
      };
    }

    const result = await sendToAllSubscriptions(supabase, payload);

    return new Response(
      JSON.stringify({
        sent: result.sent,
        total: result.total,
        errors: result.errors.length > 0 ? result.errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
