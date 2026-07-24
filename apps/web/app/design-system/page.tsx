import type { Metadata } from "next";

import { DesignSystemDemo } from "./design-system-demo";

export const metadata: Metadata = {
  title: "Design system lab | eQOURSE+",
  description: "Internal FR-PUB-00A liquid-glass acceptance route.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DesignSystemPage() {
  return <DesignSystemDemo />;
}
