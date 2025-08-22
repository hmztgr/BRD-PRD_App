import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DirectionProvider } from "@/components/providers/direction-provider";
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
  title: "BRD/PRD Generator - AI-Powered Business Document Creation",
  description: "Create professional Business Requirements Documents (BRDs) and Product Requirements Documents (PRDs) with AI assistance. Supports Arabic and English with cultural awareness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add Google Fonts for Arabic support */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100;200;300;400;500;600;700;800;900&family=Noto+Kufi+Arabic:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DirectionProvider />
        {children}
      </body>
    </html>
  );
}
