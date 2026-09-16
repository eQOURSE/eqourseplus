export const REGISTER_TITLE =
  "Register with eQOURSE+";

export const REGISTER_DESCRIPTION =
  "Choose the freelancer, vendor or client registration path that fits how you will work with eQOURSE+.";

export const FREELANCER_REGISTER_TITLE =
  "Freelancer Registration | eQOURSE+";

export const FREELANCER_REGISTER_DESCRIPTION =
  "Create your eQOURSE+ freelancer account with country selection and verification for your email address and phone number.";

export const VENDOR_REGISTER_TITLE = "Vendor Registration | eQOURSE+";

export const VENDOR_REGISTER_DESCRIPTION =
  "Register your company with eQOURSE+ using country-specific details, identifiers, documents and bank information.";

export const CLIENT_REGISTER_TITLE = "Client Registration | eQOURSE+";

export const CLIENT_REGISTER_DESCRIPTION =
  "Register your company with eQOURSE+ using country-specific identifiers, documents and an authorised person.";

export const registrationRoles = [
  {
    label: "Continue as a freelancer",
    href: "/register/freelancer",
  },
  {
    label: "Continue as a vendor",
    href: "/register/vendor",
  },
  {
    label: "Continue as a client",
    href: "/register/client",
  },
] as const;
