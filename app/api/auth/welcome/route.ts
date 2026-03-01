import { NextRequest, NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "DATOS INCOMPLETOS" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    sendNotificationEmail("welcome", email, {
      fullName: fullName || "Usuario",
      appUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
