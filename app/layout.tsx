import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartSheet } from "@/components/cart/cart-sheet";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ecommerce China",
  description: "Minimalist streetwear store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-mono`}
      >
        {children}
        <CartSheet />
        <Toaster position="top-center" />
        <script
          src="https://upload-widget.cloudinary.com/global/all.js"
          type="text/javascript"
          async
        />
      </body>
    </html>
  );
}
