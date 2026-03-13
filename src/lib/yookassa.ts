const SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!;
const API = "https://api.yookassa.ru/v3";

function authHeader(): string {
  return "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64");
}

export interface YooPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
  paid: boolean;
}

interface CreatePaymentParams {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
}

export async function createPayment(params: CreatePaymentParams): Promise<YooPayment> {
  const idempotencyKey = crypto.randomUUID();

  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      "Idempotence-Key": idempotencyKey,
    },
    body: JSON.stringify({
      amount: {
        value: params.amountRub.toFixed(2),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: params.returnUrl,
      },
      capture: true,
      description: params.description,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("YooKassa create payment error:", err);
    throw new Error("Payment creation failed");
  }

  return res.json();
}

export async function getPayment(paymentId: string): Promise<YooPayment> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  return res.json();
}

// Verify YooKassa webhook IP (optional, for production hardening)
// YooKassa sends webhooks from specific IPs: https://yookassa.ru/developers/using-api/webhooks
export function isValidWebhookIp(ip: string): boolean {
  const allowedRanges = [
    "185.71.76.", "185.71.77.",
    "77.75.153.", "77.75.154.",
    "2a02:5180::",
  ];
  return allowedRanges.some((range) => ip.startsWith(range));
}
