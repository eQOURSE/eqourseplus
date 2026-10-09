import type { Metadata } from "next";

import { VerifierTests } from "./verifier-tests";

export const metadata: Metadata = {
  title: "Assessment review | eQOURSE+",
  robots: { index: false, follow: false },
};

export default function VerifierTestsPage() { return <VerifierTests />; }
