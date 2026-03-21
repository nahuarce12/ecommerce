"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const validateRecoverySession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("EL ENLACE DE RECUPERACIÓN ES INVÁLIDO O EXPIRÓ");
      }

      setCheckingSession(false);
    };

    validateRecoverySession().catch(() => {
      setError("NO SE PUDO VALIDAR EL ENLACE DE RECUPERACIÓN");
      setCheckingSession(false);
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(password)) {
      setError("LA CONTRASEÑA DEBE TENER AL MENOS 8 CARACTERES, UNA LETRA Y UN NÚMERO");
      return;
    }

    if (password !== confirmPassword) {
      setError("LAS CONTRASEÑAS NO COINCIDEN");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Nueva contraseña</h1>
          <p className="text-xs text-muted-foreground mt-2 uppercase">
            Configurá una contraseña segura
          </p>
        </div>

        {checkingSession ? (
          <p className="text-xs text-muted-foreground text-center uppercase">Validando enlace...</p>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="text-xs uppercase font-medium block mb-2">
                  Nueva contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-xs uppercase font-medium block mb-2">
                  Repetir contraseña
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            {error && <div className="text-xs text-red-600 text-center uppercase">{error}</div>}

            <Button type="submit" className="w-full uppercase tracking-wide" disabled={loading || checkingSession}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>

            <div className="text-center text-xs">
              <Link href="/login" className="underline font-medium uppercase">
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
