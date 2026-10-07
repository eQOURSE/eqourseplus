import type { Metadata } from "next";
import { Instrument_Serif, Inter, Inter_Tight, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { themeInitializerScript } from "@eqourse/ui";

import "./globals.css";
import "../components/landing/landing.css";
import "../components/landing/chrome.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const motionReadyScript = `document.documentElement.classList.add("lx-js")`;

export const metadata: Metadata = {
  metadataBase: new URL("https://plus.eqourse.com"),
  title: "eQOURSE+",
  description: "The talent platform by eQOURSE.",
  alternates: {
    languages: {
      en: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    title: "eQOURSE+",
    description: "The talent platform by eQOURSE.",
    siteName: "eQOURSE+",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "eQOURSE+",
    description: "The talent platform by eQOURSE.",
  },
  icons: {
    icon: {
      url: "/favicon.ico",
      type: "image/svg+xml",
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${plusJakartaSans.variable} ${interTight.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
        />
        <script dangerouslySetInnerHTML={{ __html: motionReadyScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
