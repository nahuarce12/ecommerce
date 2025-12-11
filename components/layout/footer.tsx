import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-4 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-2 md:gap-4 md:h-14 md:flex-row px-4 md:px-6">
        <p className="text-center text-[10px] md:text-xs leading-loose text-muted-foreground md:text-left">
          © 2025 ECOMMERCE CHINA. ALL RIGHTS RESERVED.
        </p>
        <nav className="flex gap-3 md:gap-4 text-[10px] md:text-xs font-medium">
          <Link href="/contact" className="hover:underline underline-offset-4">
            CONTACT
          </Link>
          <Link href="/terms" className="hover:underline underline-offset-4">
            TERMS
          </Link>
          <Link href="/privacy" className="hover:underline underline-offset-4">
            PRIVACY
          </Link>
          <Link href="/accessibility" className="hover:underline underline-offset-4 hidden md:inline">
            ACCESSIBILITY
          </Link>
        </nav>
      </div>
    </footer>
  );
}
