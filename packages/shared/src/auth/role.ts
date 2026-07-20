export enum Role {
  FREELANCER = "FREELANCER",
  VENDOR = "VENDOR",
  VENDOR_MEMBER = "VENDOR_MEMBER",
  VERIFIER = "VERIFIER",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  QA_REVIEWER = "QA_REVIEWER",
  FINANCE_ADMIN = "FINANCE_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  CLIENT = "CLIENT",
}

export enum BusinessUnit {
  EQOURSE = "EQOURSE",
  TUTRAIN = "TUTRAIN",
}

export interface RoleAssignment {
  role: Role;
  businessUnit: BusinessUnit;
}
