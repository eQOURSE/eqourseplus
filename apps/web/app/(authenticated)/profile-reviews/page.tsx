import type { Metadata } from "next";

import { ProfileReviewConsole } from "../../../components/profile-reviews/profile-review-console";

export const metadata: Metadata = {
  title: "Freelancer profile review | eQOURSE+",
  description: "Verifier workspace for submitted freelancer profiles.",
  robots: { index: false, follow: false },
};

export default function ProfileReviewsPage() {
  return <ProfileReviewConsole />;
}
