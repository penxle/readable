import { z } from 'zod';

const UNAVAILABLE_SITE_SLUGS = {
  EXACT: ['admin', 'app', 'cname', 'dev', 'docs', 'help', 'template', 'www'],
};

export const dataSchemas = {
  url: z.string({ required_error: 'URL을 입력해 주세요' }).trim().url({ message: '잘못된 URL이에요' }),

  email: z
    .string({ required_error: '이메일 주소를 입력해 주세요' })
    .trim()
    .email({ message: '잘못된 이메일 주소예요' })
    .toLowerCase(),

  site: {
    name: z
      .string({ required_error: '사이트 이름을 한 글자 이상 입력해 주세요' })
      .trim()
      .min(1, { message: '사이트 이름을 한 글자 이상 입력해 주세요' })
      .max(50, { message: '사이트 이름은 50글자를 넘을 수 없어요' }),

    slug: z
      .string({ required_error: '사이트 주소를 입력해 주세요' })
      .trim()
      .toLowerCase()
      .min(4, { message: '사이트 주소는 4글자 이상이여야 해요' })
      .max(63, { message: '사이트 주소는 63글자를 넘을 수 없어요' })
      .regex(/^[\da-z-]+$/, { message: '사이트 주소는 소문자, 숫자, 하이픈만 사용할 수 있어요' })
      .regex(/^[\da-z][\da-z-]*[\da-z]$/, { message: '사이트 주소는 하이픈으로 시작하거나 끝날 수 없어요' })
      .refine((str) => !str.includes('--'), { message: '하이픈을 연속으로 사용할 수 없어요' })
      .refine((str) => !UNAVAILABLE_SITE_SLUGS.EXACT.includes(str), { message: '사용할 수 없는 사이트 주소에요' }),

    domain: z
      .string({ required_error: '도메인을 입력해 주세요' })
      .trim()
      .toLowerCase()
      .min(4, { message: '도메인을 입력해 주세요' })
      .regex(/^(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[\da-z][\da-z-]{0,61}[\da-z]$/, {
        message: '도메인이 형식에 맞지 않아요',
      }),

    themeColor: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^#?[\da-f]{6}$/, { message: '올바른 색상 코드를 입력해 주세요' }),
  },

  user: {
    name: z
      .string({ required_error: '이름을 입력해 주세요' })
      .trim()
      .min(1, { message: '이름을 입력해 주세요' })
      .max(50, { message: '이름은 50글자를 넘을 수 없어요' }),
  },

  team: {
    id: z.string(),
    name: z
      .string({ required_error: '팀 이름을 입력해 주세요' })
      .trim()
      .min(1, { message: '팀 이름을 입력해 주세요' })
      .max(50, { message: '팀 이름은 50글자를 넘을 수 없어요' }),
  },

  card: {
    number: z
      .string({ required_error: '카드 번호를 입력해 주세요' })
      .transform((str) => str.replaceAll(/\D/g, ''))
      .refine((str) => str.length >= 15 && str.length <= 16, { message: '올바른 카드 번호를 입력해 주세요' }),

    expiry: z
      .string({ required_error: '만료일을 입력해 주세요' })
      .transform((str) => str.replaceAll(/\D/g, ''))
      .refine((str) => str.length === 4, { message: '올바른 만료일을 입력해 주세요' }),

    birthOrBusinessRegistrationNumber: z
      .string({ required_error: '생년월일 또는 사업자 등록번호를 입력해 주세요' })
      .transform((str) => str.replaceAll(/\D/g, ''))
      .refine((str) => str.length === 6 || str.length === 10, {
        message: '올바른 생년월일 또는 사업자 등록번호를 입력해 주세요',
      }),

    passwordTwoDigits: z
      .string({ required_error: '카드 비밀번호를 입력해 주세요' })
      .regex(/^\d{2}$/, { message: '올바른 카드 비밀번호를 입력해 주세요' }),
  },

  page: {
    slug: z
      .string({ required_error: '페이지 주소를 입력해 주세요' })
      .trim()
      .min(1, { message: '페이지 주소는 1글자 이상이여야 해요' })
      .max(31, { message: '페이지 주소는 31글자를 넘을 수 없어요' })
      .regex(/^[\da-z-]+$/, { message: '페이지 주소는 소문자, 숫자, 하이픈만 사용할 수 있어요' })
      .refine((str) => !str.startsWith('-') && !str.endsWith('-'), {
        message: '페이지 주소는 하이픈으로 시작하거나 끝날 수 없어요',
      })
      .refine((str) => !str.includes('--'), { message: '페이지 주소에 하이픈을 연속으로 사용할 수 없어요' }),
  },

  category: {
    slug: z
      .string({ required_error: '카테고리 주소를 입력해 주세요' })
      .trim()
      .min(1, { message: '카테고리 주소는 1글자 이상이여야 해요' })
      .max(31, { message: '카테고리 주소는 31글자를 넘을 수 없어요' })
      .regex(/^[\da-z-]+$/, { message: '카테고리 주소는 소문자, 숫자, 하이픈만 사용할 수 있어요' })
      .refine((str) => !str.startsWith('-') && !str.endsWith('-'), {
        message: '카테고리 주소는 하이픈으로 시작하거나 끝날 수 없어요',
      })
      .refine((str) => !str.includes('--'), { message: '카테고리 주소에 하이픈을 연속으로 사용할 수 없어요' }),
  },
};

export const inputSchemas = {
  site: {
    create: z.object({
      name: dataSchemas.site.name,
    }),

    update: z.object({
      name: dataSchemas.site.name,
      slug: dataSchemas.site.slug,
    }),
  },

  user: {
    update: z.object({
      name: dataSchemas.user.name,
    }),
  },

  team: {
    create: z.object({
      name: dataSchemas.team.name,
    }),

    inviteMember: z.object({
      email: dataSchemas.email,
    }),
  },
};
