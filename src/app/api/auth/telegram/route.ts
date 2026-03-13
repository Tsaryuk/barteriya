import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramLogin, getOrCreateUser, createJWT, type TelegramLoginData } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TelegramLoginData;

    // Allow dev login in development mode
    const isDev = process.env.NODE_ENV === "development" && body.hash === "dev";

    if (process.env.TELEGRAM_BOT_TOKEN && !isDev) {
      if (!verifyTelegramLogin(body)) {
        return NextResponse.json({ error: "Invalid Telegram auth" }, { status: 401 });
      }
      const authAge = Math.floor(Date.now() / 1000) - body.auth_date;
      if (authAge > 86400) {
        return NextResponse.json({ error: "Auth data expired" }, { status: 401 });
      }
    }

    const user = await getOrCreateUser(body);
    const token = createJWT({ userId: user.id, telegramId: user.telegram_id, role: user.role });

    return NextResponse.json({ token, user });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
