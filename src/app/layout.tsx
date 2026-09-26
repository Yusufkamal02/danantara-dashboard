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
  title: "Danantara Analytics Terminal",
  description:
    "Mockup PoC — Investment Intelligence Platform untuk portofolio Danantara. Seluruh angka adalah data contoh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plexMono.variable} ${plexCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
