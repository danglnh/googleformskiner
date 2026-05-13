import { NextResponse } from "next/server";
import { z } from "zod";
import { isPinValid, setAuthCookie } from "@/lib/auth";

const bodySchema = z.object({
  pin: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = bodySchema.parse(body);

    if (!isPinValid(pin)) {
      return NextResponse.json({ ok: false, message: "Invalid PIN" }, { status: 401 });
    }

    await setAuthCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: "PIN is required" }, { status: 400 });
    }

    if (error instanceof Error) {
      if (
        error.message.includes("APP_PIN is not set") ||
        error.message.includes("AUTH_COOKIE_SECRET must be set")
      ) {
        return NextResponse.json(
          { ok: false, message: "Server env is missing APP_PIN or AUTH_COOKIE_SECRET" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
}
