import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";
import { isValidEmail, sanitizeText } from "@/lib/validators";

const USERS_PER_PAGE = 200;

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request.headers);
    const limiter = checkRateLimit(`check-email:${ip}`, 10, 60_000);

    if (!limiter.allowed) {
      return NextResponse.json({ error: "DEMASIADAS SOLICITUDES" }, { status: 429 });
    }

    const body = (await request.json()) as { email?: string };
    const emailInput = typeof body?.email === "string" ? body.email : "";
    const email = sanitizeText(emailInput, 120).toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "EMAIL INVÁLIDO" }, { status: 400 });
    }

    const supabase = createServiceClient();

    let page = 1;
    let exists = false;

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: USERS_PER_PAGE,
      });

      if (error) {
        console.error("Error listing users for email check:", error);
        return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
      }

      const users = data?.users ?? [];
      exists = users.some((user) => (user.email ?? "").toLowerCase() === email);

      if (exists) {
        break;
      }

      if (users.length < USERS_PER_PAGE) {
        break;
      }

      page += 1;
    }

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Error checking existing email:", error);
    return NextResponse.json({ error: "ERROR INTERNO" }, { status: 500 });
  }
}
