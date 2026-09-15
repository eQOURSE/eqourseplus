import type { Metadata } from "next";
import { CompanyOnboardingEntry } from "../../../components/company-onboarding/company-onboarding-entry";
import {
  VENDOR_REGISTER_DESCRIPTION,
  VENDOR_REGISTER_TITLE,
} from "../register-data";

export const metadata: Metadata = {
  title: VENDOR_REGISTER_TITLE,
  description: VENDOR_REGISTER_DESCRIPTION,
  alternates: { canonical: "/register/vendor" },
  robots: { index: false, follow: true },
};

export default function VendorRegistrationPage() {
  return <CompanyOnboardingEntry actor="vendor" />;
}
