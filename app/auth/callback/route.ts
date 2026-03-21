import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email";
import { safeRedirectPath } from "@/lib/validators";
import { NextResponse } from "next/server";

const VALID_OTP_TYPES = new Set([
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email",
  "email_change",
]);

function isValidOtpType(value: string | null): value is
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email"
  | "email_change" {
  return Boolean(value && VALID_OTP_TYPES.has(value));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");
  const shouldSendWelcome = requestUrl.searchParams.get("welcome") === "1";
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next");
  const fallbackNext = shouldSendWelcome ? "/login?confirmed=true" : "/";
  const safeNext = safeRedirectPath(next ?? fallbackNext);
  const shouldTriggerWelcome = shouldSendWelcome || otpType === "signup";

  const supabase = await createClient();
  let authSucceeded = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging auth code for session:", error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    authSucceeded = true;
  } else if (tokenHash && isValidOtpType(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (error) {
      console.error("Error verifying OTP token:", error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    authSucceeded = true;
  }

  if (authSucceeded) {
    if (shouldTriggerWelcome) {
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

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
