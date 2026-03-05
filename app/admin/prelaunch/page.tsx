"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, Clock3, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type PrelaunchSettingsResponse = {
  enabled: boolean;
  launchAt: string;
  timezone: string;
  passwordVersion: number;
  updatedAt: string | null;
};

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function AdminPrelaunchPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [launchAt, setLaunchAt] = useState("");
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordVersion, setPasswordVersion] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/prelaunch/save", { method: "GET" });
      const data = (await response.json()) as PrelaunchSettingsResponse & { error?: string };

      if (!response.ok) {
        toast.error(data.error || "NO SE PUDO CARGAR CONFIGURACIÓN");
        setLoading(false);
        return;
      }

      setEnabled(data.enabled);
      setLaunchAt(toDateTimeLocal(data.launchAt));
      setTimezone(data.timezone || "America/Argentina/Buenos_Aires");
      setPasswordVersion(data.passwordVersion || 1);
      setUpdatedAt(data.updatedAt);
      setLoading(false);
    };

    void load();
  }, []);

  const launchPreview = useMemo(() => {
    if (!launchAt) return "SIN FECHA";
    const parsed = new Date(launchAt);
    if (Number.isNaN(parsed.getTime())) return "FECHA INVÁLIDA";

    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    }).format(parsed);
  }, [launchAt, timezone]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const launchIso = launchAt ? new Date(launchAt).toISOString() : null;

    const response = await fetch("/api/admin/prelaunch/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        launchAt: launchIso,
        timezone,
        password,
      }),
    });

    const data = (await response.json()) as { success?: boolean; error?: string };
    setSaving(false);

    if (!response.ok) {
      toast.error(data.error || "NO SE PUDO GUARDAR");
      return;
    }

    if (password.trim()) {
      setPassword("");
      setPasswordVersion((current) => current + 1);
    }

    setUpdatedAt(new Date().toISOString());
    toast.success("CONFIGURACIÓN DE PRE-LANZAMIENTO ACTUALIZADA");
  };

  if (loading) {
    return <div className="py-12 text-center uppercase">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-tight">Prelaunch Access</h1>
        <p className="text-sm text-muted-foreground uppercase mt-1">
          Activá o desactivá el bloqueo global de acceso
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="uppercase flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Site Access
          </CardTitle>
          <CardDescription className="uppercase text-xs">
            Estado actual: {enabled ? "Bloqueado" : "Abierto"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between border p-4">
              <div>
                <p className="text-sm font-medium uppercase">Modo pre-lanzamiento</p>
                <p className="text-xs text-muted-foreground uppercase mt-1">
                  Si está activo, el sitio pide contraseña
                </p>
              </div>

              <label className="inline-flex items-center gap-2 uppercase text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                  className="h-4 w-4"
                />
                {enabled ? "ON" : "OFF"}
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="launch-at" className="uppercase text-xs">Fecha de apertura</Label>
              <Input
                id="launch-at"
                type="datetime-local"
                value={launchAt}
                onChange={(event) => setLaunchAt(event.target.value)}
                required
              />
              <p className="text-xs uppercase text-muted-foreground">{launchPreview}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timezone" className="uppercase text-xs">Zona horaria</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="uppercase"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="uppercase text-xs">Nueva contraseña (opcional)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="MINIMO 6 CARACTERES"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs uppercase text-muted-foreground">
                Versión de contraseña: {passwordVersion}
              </p>
            </div>

            <Separator />

            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <p className="text-xs uppercase text-muted-foreground flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString("es-AR") : "-"}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="uppercase"
                  onClick={() => setEnabled(false)}
                >
                  Desactivar
                </Button>
                <Button type="submit" className="uppercase" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
