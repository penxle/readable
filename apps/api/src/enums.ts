export type AiChatMessageRole = keyof typeof AiChatMessageRole;
export const AiChatMessageRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
} as const;

export type BillingCycle = keyof typeof BillingCycle;
export const BillingCycle = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type CategoryState = keyof typeof CategoryState;
export const CategoryState = {
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
} as const;

export type JobState = keyof typeof JobState;
export const JobState = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type PageContentCommentState = keyof typeof PageContentCommentState;
export const PageContentCommentState = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  DELETED: 'DELETED',
} as const;

export type PageContentSyncKind = keyof typeof PageContentSyncKind;
export const PageContentSyncKind = {
  UPDATE: 'UPDATE',
  VECTOR: 'VECTOR',
  AWARENESS: 'AWARENESS',
  HEARTBEAT: 'HEARTBEAT',
} as const;

export type PageState = keyof typeof PageState;
export const PageState = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  DELETED: 'DELETED',
} as const;

export type PaymentInvoiceItemType = keyof typeof PaymentInvoiceItemType;
export const PaymentInvoiceItemType = {
  PLAN: 'PLAN',
  ADDON: 'ADDON',
} as const;

export type PaymentInvoiceState = keyof typeof PaymentInvoiceState;
export const PaymentInvoiceState = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
} as const;

export type PaymentMethodState = keyof typeof PaymentMethodState;
export const PaymentMethodState = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export type PaymentRecordType = keyof typeof PaymentRecordType;
export const PaymentRecordType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const;

export type PlanType = keyof typeof PlanType;
export const PlanType = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

export type SingleSignOnProvider = keyof typeof SingleSignOnProvider;
export const SingleSignOnProvider = {
  GOOGLE: 'GOOGLE',
} as const;

export type SiteCustomDomainState = keyof typeof SiteCustomDomainState;
export const SiteCustomDomainState = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
} as const;

export type SiteHeaderLinkState = keyof typeof SiteHeaderLinkState;
export const SiteHeaderLinkState = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
} as const;

export type SiteState = keyof typeof SiteState;
export const SiteState = {
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
} as const;

export type TeamMemberRole = keyof typeof TeamMemberRole;
export const TeamMemberRole = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type TeamRestrictionType = keyof typeof TeamRestrictionType;
export const TeamRestrictionType = {
  DASHBOARD_WRITE: 'DASHBOARD_WRITE',
  USERSITE_READ: 'USERSITE_READ',
} as const;

export type TeamState = keyof typeof TeamState;
export const TeamState = {
  ACTIVE: 'ACTIVE',
  DELETED: 'DELETED',
} as const;

export type UserState = keyof typeof UserState;
export const UserState = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const;
