import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz"],
});

const text = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-text",
});

export const metadata: Metadata = {
  title: site.artistName,
  description: site.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
