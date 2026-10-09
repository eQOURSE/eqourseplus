import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
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

// Display face for headings across the public site and the workspace.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

// Small technical labels (telemetry, track numbers, URLs).
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const motionReadyScript = `document.documentElement.classList.add("q-js")`;

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
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
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
