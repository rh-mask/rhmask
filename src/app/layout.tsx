import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "VeilStreet",
    template: "%s · VeilStreet",
  },
  description:
    "The privacy layer for tokenized stocks on Robinhood Chain. Receive unseen, trade unseen, and get paid in real stock tokens.",
  openGraph: {
    title: "VeilStreet",
    description: "Wall Street sees everything. VeilStreet sees nothing.",
    type: "website",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "VeilStreet",
    description: "Wall Street sees everything. VeilStreet sees nothing.",
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
