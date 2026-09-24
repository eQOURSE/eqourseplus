import type { Metadata } from "next";

import { TestCenter } from "./test-center";

export const metadata: Metadata = {
  title: "Test Center | eQOURSE+",
  robots: { index: false, follow: false },
};

export default function TestsPage() { return <TestCenter />; }
