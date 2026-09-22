import type { Metadata } from "next";

import { ProfileWizard } from "../../../components/profile-wizard/profile-wizard";

export const metadata: Metadata = {
  title: "Build your profile | eQOURSE+",
  description: "Save and continue your eQOURSE+ freelancer profile.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileWizard />;
}
