import type { Metadata } from "next";

import { CompanyReviewConsole } from "../../../components/company-reviews/company-review-console";

export const metadata: Metadata = {
  title: "Company verification | eQOURSE+",
  description: "Review submitted vendor and client company records.",
  robots: { index: false, follow: false },
};

export default function CompanyReviewsPage() {
  return <CompanyReviewConsole />;
}
