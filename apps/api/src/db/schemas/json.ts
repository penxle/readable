export type PlanRules = {
  memberLimit: number | null;
  siteLimit: number | null;
  pageViewLimit: number | null;
  memberRole: boolean;
  themeColor: boolean;
  customDomain: boolean;
  aiSearch: boolean;
  headerLink: boolean;
  widget: boolean;
  addonsAvailable: string[];
};

export const defaultPlanRules: PlanRules = {
  memberLimit: 1,
  siteLimit: 1,
  pageViewLimit: 500,
  memberRole: false,
  themeColor: false,
  customDomain: false,
  aiSearch: false,
  headerLink: false,
  widget: false,
  addonsAvailable: [],
};
