import type { Metadata } from "next";

import { DesignSystemDemo } from "./design-system-demo";

export const metadata: Metadata = {
  title: "Design system lab | eQOURSE+",
  description: "Internal FR-PUB-00 design-system acceptance route.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DesignSystemPage() {
  return <DesignSystemDemo />;
}
