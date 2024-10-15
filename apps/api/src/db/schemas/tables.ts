// spell-checker:ignoreRegExp /createDbId\('[A-Z]{1,4}'/g

import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { bigint, index, integer, pgTable, text, unique, uniqueIndex, vector } from 'drizzle-orm/pg-core';
import * as E from './enums';
import { createDbId } from './id';
import { bytea, datetime, jsonb } from './types';
import type { JSONContent } from '@tiptap/core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { PlanRules } from './json';

const createCategoryAndPageSlug = () => faker.string.numeric(10);

export const Addons = pgTable('addons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('ADD', { length: 'short' })),
  name: text('name').notNull(),
  fee: integer('fee').notNull().default(0),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Categories = pgTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('CTG')),
    siteId: text('site_id')
      .notNull()
      .references(() => Sites.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug')
      .notNull()
      .$defaultFn(() => createCategoryAndPageSlug()),
    state: E._CategoryState('state').notNull().default('ACTIVE'),
    order: bytea('order').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    siteIdSlugUniq: unique().on(t.siteId, t.slug),
    siteIdOrderUniq: unique().on(t.siteId, t.order),
  }),
);

export const Embeds = pgTable('embeds', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('EMBD')),
  url: text('url').notNull().unique(),
  type: text('type').notNull(),
  title: text('title'),
  description: text('description'),
  html: text('html'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Files = pgTable('files', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('FILE')),
  userId: text('user_id').references(() => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  name: text('name').notNull(),
  format: text('format').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Images = pgTable('images', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('IMG')),
  userId: text('user_id').references((): AnyPgColumn => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  name: text('name').notNull(),
  format: text('format').notNull(),
  size: integer('size').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  placeholder: text('placeholder').notNull(),
  path: text('path').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Jobs = pgTable(
  'jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('J', { length: 'long' })),
    lane: text('lane').notNull(),
    name: text('name').notNull(),
    payload: jsonb('payload').notNull(),
    retries: integer('retries').notNull().default(0),
    state: E._JobState('state').notNull().default('PENDING'),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    laneStateCreatedAtIdx: index().on(t.lane, t.state, t.createdAt),
  }),
);

export const Pages = pgTable(
  'pages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('P', { length: 'short' })),
    siteId: text('site_id')
      .notNull()
      .references(() => Sites.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => Categories.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    parentId: text('parent_id').references((): AnyPgColumn => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    slug: text('slug')
      .notNull()
      .$defaultFn(() => createCategoryAndPageSlug()),
    state: E._PageState('state').notNull().default('DRAFT'),
    order: bytea('order').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    siteIdStateIdx: index().on(t.siteId, t.state),
    siteIdCategoryIdParentIdSlugUniq: unique().on(t.siteId, t.categoryId, t.parentId, t.slug).nullsNotDistinct(),
    siteIdCategoryIdParentIdOrderUniq: unique().on(t.siteId, t.categoryId, t.parentId, t.order).nullsNotDistinct(),
  }),
);

export const PageContents = pgTable(
  'page_contents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('PCC')),
    pageId: text('page_id')
      .notNull()
      .unique()
      .references(() => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    title: text('title'),
    subtitle: text('subtitle'),
    content: jsonb('content').notNull().$type<JSONContent>(),
    text: text('text').notNull(),
    hash: text('hash').notNull(),
    summary: text('summary'),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    pageIdCreatedAtIdx: index().on(t.pageId, t.createdAt),
  }),
);

export const PageContentChunks = pgTable(
  'page_content_chunks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('PCCH')),
    pageId: text('page_id')
      .notNull()
      .references(() => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    hash: text('hash').notNull(),
    vector: vector('vector', { dimensions: 1536 }).notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    vectorCosineSimilarityIdx: index('vector_cosine_similarity_idx').using('hnsw', t.vector.op('vector_cosine_ops')),
  }),
);

export const PageContentContributors = pgTable(
  'page_content_contributors',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('PCCB')),
    pageId: text('page_id')
      .notNull()
      .references(() => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    userId: text('user_id')
      .notNull()
      .references(() => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    pageIdUserIdUniq: unique().on(t.pageId, t.userId),
    pageIdUpdatedAtIdx: index().on(t.pageId, t.updatedAt),
  }),
);

export const PageContentSnapshots = pgTable(
  'page_content_snapshots',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('PCSN')),
    pageId: text('page_id')
      .notNull()
      .references(() => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    snapshot: bytea('snapshot').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    pageIdCreatedAtIdx: index().on(t.pageId, t.createdAt),
  }),
);

export const PageContentStates = pgTable('page_content_states', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('PCST')),
  pageId: text('page_id')
    .notNull()
    .unique()
    .references(() => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  title: text('title'),
  subtitle: text('subtitle'),
  content: jsonb('content').notNull().$type<JSONContent>(),
  text: text('text').notNull(),
  update: bytea('update').notNull(),
  vector: bytea('vector').notNull(),
  hash: text('hash').notNull(),
  seq: bigint('seq', { mode: 'bigint' })
    .notNull()
    .default(sql`0`),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const PageContentUpdates = pgTable('page_content_updates', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('PCUP')),
  userId: text('user_id')
    .notNull()
    .references(() => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  pageId: text('page_id')
    .notNull()
    .references(() => Pages.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  update: bytea('update').notNull(),
  seq: bigint('seq', { mode: 'bigint' }).notNull().generatedAlwaysAsIdentity(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const PageViews = pgTable(
  'page_views',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('PV')),
    pageId: text('page_id')
      .notNull()
      .references(() => Pages.id),
    deviceId: text('device_id').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    pageIdDeviceIdCreatedAtIdx: index().on(t.pageId, t.deviceId, t.createdAt),
  }),
);

export const PaymentInvoices = pgTable('payment_invoices', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('PYIV')),
  teamId: text('team_id')
    .notNull()
    .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  state: E._PaymentInvoiceState('state').notNull().default('PENDING'),
  amount: integer('amount').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const PaymentInvoiceItems = pgTable('payment_invoice_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('PYIT')),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => PaymentInvoices.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  amount: integer('amount').notNull(),
  type: E._PaymentInvoiceItemType('type').notNull(),
  order: integer('order').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const PaymentMethods = pgTable(
  'payment_methods',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('PYMT')),
    teamId: text('team_id')
      .notNull()
      .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    name: text('name').notNull(),
    billingKey: text('billing_key').notNull(),
    state: E._PaymentMethodState('state').notNull().default('ACTIVE'),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    teamIdUniqIdx: uniqueIndex()
      .on(t.teamId)
      .where(sql`${t.state} = 'ACTIVE'`),
  }),
);

export const PaymentRecords = pgTable('payment_records', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('PYRD')),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => PaymentInvoices.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  methodId: text('method_id')
    .notNull()
    .references(() => PaymentMethods.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  type: E._PaymentRecordType('type').notNull(),
  amount: integer('amount').notNull(),
  receiptUrl: text('receipt_url'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Plans = pgTable('plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('PLAN', { length: 'short' })),
  name: text('name').notNull(),
  rules: jsonb('rules').notNull().$type<Partial<PlanRules>>(),
  fee: integer('fee').notNull().default(0),
  type: E._PlanType('type').notNull().default('PUBLIC'),
  order: integer('order').notNull().default(0),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Sites = pgTable(
  'sites',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('S', { length: 'short' })),
    teamId: text('team_id')
      .notNull()
      .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    state: E._SiteState('state').notNull().default('ACTIVE'),
    logoId: text('logo_id').references(() => Images.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    themeColor: text('theme_color').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugStateIdx: index().on(t.slug, t.state),
    slugUniqIdx: uniqueIndex()
      .on(t.slug)
      .where(sql`${t.state} = 'ACTIVE'`),
    teamIdStateIdx: index().on(t.teamId, t.state),
  }),
);

export const SiteAddons = pgTable(
  'site_addons',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('SADD')),
    siteId: text('site_id')
      .notNull()
      .references(() => Sites.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    addonId: text('addon_id')
      .notNull()
      .references(() => Addons.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    siteIdAddonIdUniq: unique().on(t.siteId, t.addonId),
  }),
);

export const SiteCustomDomains = pgTable(
  'site_custom_domains',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('SCD')),
    siteId: text('site_id')
      .notNull()
      .references(() => Sites.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    domain: text('domain').notNull(),
    state: E._SiteCustomDomainState('state').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    domainStateIdx: index().on(t.domain, t.state),
    domainUniqIdx: uniqueIndex()
      .on(t.domain)
      .where(sql`${t.state} = 'ACTIVE'`),
  }),
);

export const SiteHeaderLinks = pgTable('site_header_links', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('SHDL')),
  siteId: text('site_id')
    .notNull()
    .unique()
    .references(() => Sites.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  state: E._SiteHeaderLinkState('state').notNull().default('ACTIVE'),
  label: text('label').notNull(),
  url: text('url').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Teams = pgTable(
  'teams',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('T', { length: 'short' })),
    name: text('name').notNull(),
    state: E._TeamState('state').notNull().default('ACTIVE'),
    avatarId: text('avatar_id')
      .notNull()
      .references(() => Images.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    stateIdx: index().on(t.state),
  }),
);

export const TeamMembers = pgTable(
  'team_members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('TM')),
    teamId: text('team_id')
      .notNull()
      .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    userId: text('user_id')
      .notNull()
      .references(() => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    role: E._TeamMemberRole('role').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdTeamIdUniq: unique().on(t.userId, t.teamId),
    teamIdUserIdRoleIdx: index().on(t.teamId, t.userId, t.role),
  }),
);

export const TeamMemberInvitations = pgTable(
  'team_member_invitations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('TMIV')),
    teamId: text('team_id')
      .notNull()
      .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    email: text('email').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
    expiresAt: datetime('expires_at').notNull(),
  },
  (t) => ({
    teamIdEmailUniq: unique().on(t.teamId, t.email),
  }),
);

export const TeamPlans = pgTable('team_plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('TPLN')),
  teamId: text('team_id')
    .notNull()
    .unique()
    .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  planId: text('plan_id')
    .notNull()
    .references(() => Plans.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  billingCycle: E._BillingCycle('billing_cycle').notNull(),
  billingEmail: text('billing_email').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
  enrolledAt: datetime('enrolled_at')
    .notNull()
    .default(sql`now()`),
});

export const TeamRestrictions = pgTable('team_restrictions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createDbId('TRST')),
  teamId: text('team_id')
    .notNull()
    .references(() => Teams.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
  type: E._TeamRestrictionType('type').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
  effectiveAt: datetime('effective_at').notNull(),
  expiresAt: datetime('expires_at'),
});

export const Users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('U', { length: 'short' })),
    email: text('email').notNull(),
    name: text('name').notNull(),
    avatarId: text('avatar_id')
      .notNull()
      .references(() => Images.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    state: E._UserState('state').notNull().default('ACTIVE'),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    emailStateIdx: index().on(t.email, t.state),
    emailUniqIdx: uniqueIndex()
      .on(t.email)
      .where(sql`${t.state} = 'ACTIVE'`),
  }),
);

export const UserSessions = pgTable(
  'user_sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('USES')),
    userId: text('user_id')
      .notNull()
      .references(() => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index().on(t.userId),
  }),
);

export const UserSingleSignOns = pgTable(
  'user_single_sign_ons',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createDbId('USSO')),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => Users.id, { onUpdate: 'cascade', onDelete: 'restrict' }),
    provider: E._SingleSignOnProvider('provider').notNull(),
    principal: text('principal').notNull(),
    email: text('email').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    providerPrincipalUniq: unique().on(t.provider, t.principal),
  }),
);
