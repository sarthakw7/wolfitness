import type { Metadata } from "next";
import { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabaseServer'; // Correctly import the server-side client
import { SupabaseProvider } from '@/components/SupabaseProvider'; // Import the new client provider
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WFF Ecosystem",
  description: "The most advanced global fitness ecosystem.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient(); // Use the server-side client
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SupabaseProvider initialSession={session}>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
