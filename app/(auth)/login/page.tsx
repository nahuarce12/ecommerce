"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowSuccess(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Login</h1>
          <p className="text-xs text-muted-foreground mt-2 uppercase">
            Enter your credentials
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {showSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800 uppercase">
                Registration successful! Please check your email to confirm your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
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

            <div>
              <label htmlFor="password" className="text-xs uppercase font-medium block mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 text-center uppercase">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full uppercase tracking-wide"
            disabled={loading}
          >
            {loading ? "Loading..." : "Sign In"}
          </Button>

          <div className="text-center text-xs">
            <span className="text-muted-foreground uppercase">Don't have an account? </span>
            <Link href="/signup" className="underline font-medium uppercase">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
