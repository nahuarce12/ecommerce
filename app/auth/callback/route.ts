import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email";
import { safeRedirectPath } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const shouldSendWelcome = requestUrl.searchParams.get("welcome") === "1";
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next");
  const fallbackNext = shouldSendWelcome ? "/login?confirmed=true" : "/";
  const safeNext = safeRedirectPath(next ?? fallbackNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (shouldSendWelcome) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user?.email) {
            const fullName =
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : "Usuario";

            await sendNotificationEmail("welcome", user.email, {
              fullName,
              appUrl: origin,
            });
          }
        } catch (welcomeError) {
          console.error("Error sending welcome email after confirmation:", welcomeError);
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
