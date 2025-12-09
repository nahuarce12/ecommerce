import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row md:px-6">
        <p className="text-center text-xs leading-loose text-muted-foreground md:text-left">
          © 2025 ECOMMERCE CHINA. ALL RIGHTS RESERVED.
        </p>
        <nav className="flex gap-4 text-xs font-medium">
          <Link href="#" className="hover:underline underline-offset-4">
            CONTACT
          </Link>
          <Link href="#" className="hover:underline underline-offset-4">
            TERMS
          </Link>
          <Link href="#" className="hover:underline underline-offset-4">
            PRIVACY
          </Link>
          <Link href="#" className="hover:underline underline-offset-4">
            ACCESSIBILITY
          </Link>
        </nav>
      </div>
    </footer>
  );
}
