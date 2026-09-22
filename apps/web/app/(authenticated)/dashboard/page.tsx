import type { Metadata } from "next";

import { DashboardHome } from "../../../components/dashboard/dashboard-home";

export const metadata: Metadata = {
  title: "Your workspace | eQOURSE+",
  description: "Your role-resolved eQOURSE+ workspace.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardHome />;
}
