import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { clientName, slotTime, bookingDate, service } = body;

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth");

    if (error || !subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ sent: 0, message: "VAPID keys not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationPayload = {
      title: "Rezervim i Ri!",
      body: `${clientName} — ${bookingDate} ora ${slotTime}${service ? ` · ${service}` : ""}`,
      url: "/",
    };

    let sentCount = 0;
    for (const sub of subs) {
      try {
        const result = await sendWebPush(
          sub.endpoint,
          sub.p256dh,
          sub.auth,
          vapidPublicKey,
          vapidPrivateKey,
          notificationPayload
        );
        if (result.ok) {
          sentCount++;
        } else if (result.status === 404 || result.status === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      } catch {
        // skip individual failures
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total: subs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number }> {
  const audience = new URL(endpoint).origin;
  const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);
  const encrypted = await encryptPayload(JSON.stringify(payload), p256dh, auth);
  const headers: Record<string, string> = {
    "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
    "TTL": "86400",
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: encrypted,
  });
  return { ok: response.ok, status: response.status };
}

async function createVapidJwt(audience: string, publicKey: string, privateKey: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 43200,
    sub: "mailto:berberegli@gmail.com",
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importP256PrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${signingInput}.${encodedSignature}`;
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importP256PrivateKey(privateKeyB64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(privateKeyB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string
): Promise<Uint8Array> {
  const p256dh = Uint8Array.from(atob(p256dhB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const authSecret = Uint8Array.from(atob(authB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    p256dh,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const ephemeralRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey)
  );

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberKey },
    ephemeralKeyPair.privateKey,
    256
  );

  const ikm = new Uint8Array(sharedSecret);
  const prk = await hkdf(ikm, authSecret, new TextEncoder().encode("WebPush: info\0"), 32);
  const cek = await hkdf(prk, new Uint8Array(0), new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(prk, new Uint8Array(0), new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  const plaintext = new TextEncoder().encode(payload);
  const encrypted = await aes128gcmEncrypt(plaintext, cek, nonce);

  const header = new Uint8Array(21 + ephemeralRaw.length);
  header[0] = 0; // reserved
  header[1] = 16; // record size (minus header)
  new DataView(header.buffer).setUint32(9, 4096);
  header.set(ephemeralRaw, 21);

  const result = new Uint8Array(header.length + encrypted.length);
  result.set(header, 0);
  result.set(encrypted, header.length);
  return result;
}

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

async function aes128gcmEncrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    cryptoKey,
    plaintext
  );
  return new Uint8Array(encrypted);
}
