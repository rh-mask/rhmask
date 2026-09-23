import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

/** The only face: the whole product reads as a terminal. */
const code = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-code",
  display: "swap",
});

/** Canonical site. Set NEXT_PUBLIC_APP_URL=https://rhmask.org in production. */
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${SITE.name} · Privacy for tokenized stocks`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ["stealth addresses", "ERC-5564", "tokenized stocks", "Robinhood Chain", "privacy", "private payments"],
  applicationName: SITE.name,
  openGraph: {
    title: SITE.name,
    description: SITE.tagline,
    type: "website",
    url: appUrl,
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.tagline,
    site: SITE.x.handle,
    creator: SITE.x.handle,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={code.variable}>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn btn-primary text-sm"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
