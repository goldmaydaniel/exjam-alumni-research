import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StableHeader } from "@/components/layouts/stable-header";
import { SimpleFooter } from "@/components/layouts/simple-footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorBoundary } from "@/components/error-boundary";
import { ClientProviders } from "@/components/providers/client-providers";
import { SkipToMain } from "@/components/ui/accessibility";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The EXJAM Association PG Conference 2025 - Maiden Flight",
  description:
    "President General's Conference - November 28-30, 2025 at NAF Conference Centre, Abuja. Leadership training, entrepreneurship opportunities, networking & community service. The EXJAM Association - AFMS Jos Alumni - Strive to Excel.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/exjam-logo.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/exjam-logo.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "icon", url: "/exjam-logo.svg", type: "image/svg+xml" }],
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <SkipToMain />
        <ErrorBoundary>
          <ClientProviders>
            <div className="flex min-h-screen flex-col">
              <StableHeader />
              <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
                {children}
              </main>
              <SimpleFooter />
            </div>
            <Analytics />
            <SpeedInsights />
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
