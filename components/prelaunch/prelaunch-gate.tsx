"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function getRemainingMs(launchAt: string): number {
  const targetMs = Date.parse(launchAt);
  if (!Number.isFinite(targetMs)) return 0;
  return Math.max(0, targetMs - Date.now());
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

type PrelaunchGateProps = {
  launchAt: string;
  timezone: string;
};

function sanitizeNextPath(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  return value;
}

export function PrelaunchGate({ launchAt, timezone }: PrelaunchGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use a stable SSR value to avoid hydration mismatch, then sync with real time on mount.
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    setRemainingMs(getRemainingMs(launchAt));

    const timer = setInterval(() => {
      setRemainingMs(getRemainingMs(launchAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [launchAt]);

  const countdown = useMemo(() => formatRemaining(remainingMs), [remainingMs]);

  const launchLabel = useMemo(() => {
    const date = new Date(launchAt);
    if (Number.isNaN(date.getTime())) {
      return "PRÓXIMAMENTE";
    }

    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    }).format(date);
  }, [launchAt, timezone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const response = await fetch("/api/prelaunch/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setErrorMessage(data?.error || "NO SE PUDO DESBLOQUEAR EL ACCESO");
      return;
    }

    const nextPath = sanitizeNextPath(searchParams.get("next"));
    router.replace(nextPath);
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-2">
        <CardHeader>
          <CardTitle className="uppercase tracking-tight text-xl md:text-2xl">
            Supply World
          </CardTitle>
          <CardDescription className="uppercase text-xs md:text-sm">
            Inauguración oficial: {launchLabel}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {[
              { label: "Días", value: countdown.days },
              { label: "Horas", value: countdown.hours },
              { label: "Min", value: countdown.minutes },
              { label: "Seg", value: countdown.seconds },
            ].map((part) => (
              <div key={part.label} className="border p-3 md:p-4 text-center">
                <p className="text-xl md:text-2xl font-bold leading-none">{part.value}</p>
                <p className="text-[10px] md:text-xs uppercase text-muted-foreground mt-2">{part.label}</p>
              </div>
            ))}
          </div>

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="CONTRASEÑA DE ACCESO"
              className="uppercase"
              autoComplete="off"
              required
            />

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle className="uppercase">Acceso denegado</AlertTitle>
                <AlertDescription className="uppercase text-xs">{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full uppercase" disabled={submitting}>
              {submitting ? "VERIFICANDO..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
