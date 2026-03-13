import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getWebhookInfo } from "@/lib/telegram";

// GET /api/telegram/setup - show current webhook info
export async function GET() {
  try {
    const info = await getWebhookInfo();
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ error: "Failed to get webhook info" }, { status: 500 });
  }
}

// POST /api/telegram/setup - register webhook
// Body: { "url": "https://your-domain.com" } or auto-detect from request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let baseUrl = body.url as string | undefined;

    if (!baseUrl) {
      const host = req.headers.get("host");
      const proto = req.headers.get("x-forwarded-proto") || "https";
      baseUrl = `${proto}://${host}`;
    }

    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    const ok = await setWebhook(webhookUrl);

    return NextResponse.json({ ok, webhookUrl });
  } catch (error) {
    console.error("Setup webhook error:", error);
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 500 });
  }
}
