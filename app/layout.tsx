import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jebbs Burgers",
  description: "Sistema de gestión de operaciones para Jebbs Burgers",
  generator: "v0.app",
  icons: {
    icon: "/jebbs.jpg",
    apple: "/jebbs.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
