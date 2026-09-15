export type CompanyActor = "vendor" | "client";

export interface CompanyActorConfig {
  authorisedPerson: boolean;
  bankDetails: boolean;
  capabilities: boolean;
  website: boolean;
}

export const companyActorConfig: Readonly<
  Record<CompanyActor, CompanyActorConfig>
> = Object.freeze({
  vendor: Object.freeze({
    authorisedPerson: false,
    bankDetails: true,
    capabilities: true,
    website: false,
  }),
  client: Object.freeze({
    authorisedPerson: true,
    bankDetails: false,
    capabilities: false,
    website: true,
  }),
});
