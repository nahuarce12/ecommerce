import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight">No pudimos validar el enlace</h1>
        <p className="text-xs text-muted-foreground uppercase">
          El enlace puede estar vencido o ya fue utilizado.
        </p>
        <div className="text-xs uppercase space-x-4">
          <Link href="/login" className="underline font-medium">
            Ir a login
          </Link>
          <Link href="/forgot-password" className="underline font-medium">
            Recuperar contraseña
          </Link>
        </div>
      </div>
    </div>
  );
}
