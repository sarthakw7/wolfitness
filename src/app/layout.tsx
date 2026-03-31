import type { Metadata } from "next";
import { ReactNode } from "react";
import { Montserrat, Roboto, Roboto_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabaseServer'; // Correctly import the server-side client
import { SupabaseProvider } from '@/components/SupabaseProvider'; // Import the new client provider
import QueryProvider from '@/components/QueryProvider';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WOLFITNESS",
  description: "The most advanced performance ecosystem for elite athletes.",
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
    <html lang="en" suppressHydrationWarning className={`${roboto.variable} ${robotoMono.variable} ${montserrat.variable}`}>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SupabaseProvider initialSession={session}>
              {children}
            </SupabaseProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
