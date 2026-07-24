import type { Metadata } from "next";
import type { ReactNode } from "react";
import { themeInitializerScript } from "@eqourse/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "eQOURSE+",
  description: "The talent platform by eQOURSE.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
