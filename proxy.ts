import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PRELAUNCH_ACCESS_COOKIE,
  verifyPrelaunchAccessToken,
} from "@/lib/prelaunch-access-token";
import { getDefaultPrelaunchSettings, normalizeLaunchAt } from "@/lib/prelaunch-settings";

type PublicSettingsRow = {
  enabled: boolean;
  launch_at: string;
  timezone: string;
  password_version: number;
  is_open: boolean;
};

const PRELAUNCH_ROUTE = "/pre-launch";
const AUTH_REFRESH_PREFIXES = ["/account", "/admin", "/checkout"];
const PUBLIC_BYPASS_PREFIXES = ["/_next", "/api", "/auth/callback"];
const PUBLIC_BYPASS_EXACT = [
  PRELAUNCH_ROUTE,
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function shouldBypassPrelaunch(pathname: string): boolean {
  if (PUBLIC_BYPASS_EXACT.includes(pathname)) {
    return true;
  }

  if (PUBLIC_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$/i.test(pathname);
}

function shouldRefreshAuth(pathname: string): boolean {
  return AUTH_REFRESH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  if (shouldRefreshAuth(pathname)) {
    try {
      await supabase.auth.getUser();
    } catch (error) {
      console.error("Proxy auth error:", error);
    }
  }

  if (shouldBypassPrelaunch(pathname)) {
    return supabaseResponse;
  }

  const defaults = getDefaultPrelaunchSettings();
  const { data } = await supabase.rpc("get_prelaunch_public_settings");
  const row = Array.isArray(data) ? (data[0] as PublicSettingsRow | undefined) : undefined;

  const enabled = row?.enabled ?? defaults.enabled;
  const launchAt = normalizeLaunchAt(row?.launch_at ?? defaults.launchAt);
  const passwordVersion = row?.password_version ?? defaults.passwordVersion;
  const isOpenByTime = row?.is_open ?? Date.now() >= new Date(launchAt).getTime();

  if (!enabled || isOpenByTime) {
    return supabaseResponse;
  }

  const accessToken = request.cookies.get(PRELAUNCH_ACCESS_COOKIE)?.value;
  const hasAccess = await verifyPrelaunchAccessToken(accessToken, passwordVersion);

  if (hasAccess) {
    return supabaseResponse;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = PRELAUNCH_ROUTE;
  redirectUrl.search = "";
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirectUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
