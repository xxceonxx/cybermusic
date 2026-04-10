import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
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
  title: {
    default: "Cybermusic — Make Music Together",
    template: "%s — Cybermusic",
  },
  description:
    "Create songs, collaborate with musicians worldwide, record in the browser, and mint as NFTs on Base.",
  openGraph: {
    title: "Cybermusic — Make Music Together",
    description:
      "Create songs, collaborate with musicians worldwide, record in the browser, and mint as NFTs on Base.",
    type: "website",
    siteName: "Cybermusic",
  },
  twitter: {
    card: "summary",
    title: "Cybermusic — Make Music Together",
    description:
      "Create songs, collaborate with musicians worldwide, record in the browser, and mint as NFTs on Base.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
