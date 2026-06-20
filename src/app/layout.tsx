import type { Metadata } from "next";
import { IBM_Plex_Sans, Teko } from "next/font/google";

import { SiteShell } from "@/components/layout/site-shell";
import { SupabaseSessionProvider } from "@/components/providers/supabase-session-provider";

import "./globals.css";

const headingFont = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chappal Crime Bureau",
  description:
    "A fake-government community desk for missing chappals, public tips, and dramatic meme paperwork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SupabaseSessionProvider>
          <SiteShell>{children}</SiteShell>
        </SupabaseSessionProvider>
      </body>
    </html>
  );
}
