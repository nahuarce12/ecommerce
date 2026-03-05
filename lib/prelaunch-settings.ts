export const PRELAUNCH_TIMEZONE = "America/Argentina/Buenos_Aires";
export const PRELAUNCH_DEFAULT_LAUNCH_AT = "2026-03-07T21:00:00.000Z";

export type PrelaunchPublicSettings = {
  enabled: boolean;
  launchAt: string;
  timezone: string;
  passwordVersion: number;
  isOpen: boolean;
};

export function getDefaultPrelaunchSettings(): PrelaunchPublicSettings {
  return {
    enabled: false,
    launchAt: PRELAUNCH_DEFAULT_LAUNCH_AT,
    timezone: PRELAUNCH_TIMEZONE,
    passwordVersion: 1,
    isOpen: false,
  };
}

export function normalizeLaunchAt(value: unknown): string {
  if (typeof value !== "string") {
    return PRELAUNCH_DEFAULT_LAUNCH_AT;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return PRELAUNCH_DEFAULT_LAUNCH_AT;
  }

  return parsed.toISOString();
}

export function isLaunchTimeReached(launchAtIso: string): boolean {
  const launchTime = Date.parse(launchAtIso);
  if (!Number.isFinite(launchTime)) {
    return false;
  }

  return Date.now() >= launchTime;
}
