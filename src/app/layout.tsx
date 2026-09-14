import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

/** Canonical site. Set NEXT_PUBLIC_APP_URL=https://rhmask.org in production once DNS points to Vercel. */
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "RhMask",
    template: "%s · RhMask",
  },
  description:
    "The privacy layer for tokenized stocks on Robinhood Chain. Receive unseen, trade unseen, and get paid in real stock tokens.",
  openGraph: {
    title: "RhMask",
    description: "Wall Street sees everything. RhMask sees nothing.",
    type: "website",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "RhMask",
    description: "Wall Street sees everything. RhMask sees nothing.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
