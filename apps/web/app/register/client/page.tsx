import type { Metadata } from "next";

import { CompanyOnboardingEntry } from "../../../components/company-onboarding/company-onboarding-entry";
import {
  CLIENT_REGISTER_DESCRIPTION,
  CLIENT_REGISTER_TITLE,
} from "../register-data";

export const metadata: Metadata = {
  title: CLIENT_REGISTER_TITLE,
  description: CLIENT_REGISTER_DESCRIPTION,
  alternates: { canonical: "/register/client" },
  robots: { index: false, follow: true },
};

export default function ClientRegistrationPage() {
  return <CompanyOnboardingEntry actor="client" />;
}
