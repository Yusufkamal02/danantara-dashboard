import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  // The title carries the caveat too, so a pasted link previews as a mockup
  // rather than as a Danantara reporting tool.
  title: "Mockup PoC — Danantara Analytics Terminal (Data Contoh)",
  description:
    "Mockup proof-of-concept. Seluruh angka adalah data contoh, bukan data Danantara sebenarnya, dan tidak untuk pengambilan keputusan.",
  // Deliberately kept out of search engines: the screens attach invented
  // figures to a real institution and real listed issuers.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plexMono.variable} ${plexCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
