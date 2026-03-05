import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrelaunchGate } from "@/components/prelaunch/prelaunch-gate";
import {
  getDefaultPrelaunchSettings,
  isLaunchTimeReached,
  normalizeLaunchAt,
  PRELAUNCH_TIMEZONE,
} from "@/lib/prelaunch-settings";

type PublicSettingsRow = {
  enabled: boolean;
  launch_at: string;
  timezone: string;
  password_version: number;
  is_open: boolean;
};

export default async function PreLaunchPage() {
  const supabase = await createClient();
  const defaults = getDefaultPrelaunchSettings();

  const { data } = await supabase.rpc("get_prelaunch_public_settings");
  const row = Array.isArray(data) ? (data[0] as PublicSettingsRow | undefined) : undefined;

  const enabled = row?.enabled ?? defaults.enabled;
  const launchAt = normalizeLaunchAt(row?.launch_at ?? defaults.launchAt);
  const timezone = row?.timezone || PRELAUNCH_TIMEZONE;
  const openByTime = row?.is_open ?? isLaunchTimeReached(launchAt);

  if (!enabled || openByTime) {
    redirect("/");
  }

  return <PrelaunchGate launchAt={launchAt} timezone={timezone} />;
}
