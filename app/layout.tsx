import type { Metadata } from "next";
import "./globals.css";
import { CartSheet } from "@/components/cart/cart-sheet";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Supply World",
  description: "Minimalist streetwear store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CartSheet />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
