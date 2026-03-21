"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { isValidEmail } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setError("EMAIL INVÁLIDO");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/reset-password");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: callbackUrl.toString(),
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Recuperar contraseña</h1>
          <p className="text-xs text-muted-foreground mt-2 uppercase">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-800 uppercase">
              Revisá tu email para continuar con el cambio de contraseña.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-xs uppercase font-medium block mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              placeholder="your@email.com"
            />
          </div>

          {error && <div className="text-xs text-red-600 text-center uppercase">{error}</div>}

          <Button type="submit" className="w-full uppercase tracking-wide" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </Button>

          <div className="text-center text-xs">
            <Link href="/login" className="underline font-medium uppercase">
              Volver a iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
