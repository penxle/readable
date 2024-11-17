import DataLoader from 'dataloader';
import { and, eq } from 'drizzle-orm';
import stringify from 'fast-json-stable-stringify';
import * as R from 'remeda';
import { db, first, SiteCustomDomains, Sites, UserSessions } from '@/db';
import { decodeAccessToken } from '@/utils/access-token';
import { SiteCustomDomainState, SiteState } from './enums';
import { env } from './env';
import type { YogaInitialContext } from 'graphql-yoga';

type LoaderParams<T, R, S, N extends boolean, M extends boolean> = {
  name: string;
  nullable?: N;
  many?: M;
  key: (value: N extends true ? R | null : R) => N extends true ? S | null : S;
  load: (keys: T[]) => Promise<R[]>;
};

type ServerContext = YogaInitialContext & {
  ip: string;
};

type DefaultContext = {
  req: Request;
  ip?: string;

  loader: <T, R, S, N extends boolean = false, M extends boolean = false, RR = N extends true ? R | null : R>(
    params: LoaderParams<T, R, S, N, M>,
  ) => DataLoader<T, M extends true ? RR[] : RR, string>;
  ' $loaders': Map<string, DataLoader<unknown, unknown>>;
};

export type UserContext = {
  session: {
    id: string;
    userId: string;
  };
};

export type SiteContext = {
  site: {
    id: string;
    teamId: string;
  };
};

export type Context = DefaultContext & Partial<UserContext> & Partial<SiteContext>;

export const createContext = async ({ request, ip }: ServerContext): Promise<Context> => {
  const ctx: Context = {
    req: request,
    ip,

    loader: <
      T,
      R,
      S,
      N extends boolean = false,
      M extends boolean = false,
      RR = N extends true ? R | null : R,
      F = M extends true ? RR[] : RR,
    >({
      name,
      nullable,
      many,
      load,
      key,
    }: LoaderParams<T, R, S, N, M>) => {
      const cached = ctx[' $loaders'].get(name);
      if (cached) {
        return cached as DataLoader<T, F, string>;
      }

      const loader = new DataLoader<T, F, string>(
        async (keys) => {
          const rows = await load(keys as T[]);
          const values = R.groupBy(rows, (row) => stringify(key(row)));
          return keys.map((key) => {
            const value = values[stringify(key)];

            if (value?.length) {
              return many ? value : value[0];
            }

            if (nullable) {
              return null;
            }

            if (many) {
              return [];
            }

            return new Error(`DataLoader(${name}): Missing key`);
          }) as (F | Error)[];
        },
        { cache: false },
      );

      ctx[' $loaders'].set(name, loader);

      return loader;
    },
    ' $loaders': new Map(),
  };

  const service = request.headers.get('x-rdbl-svc');

  if (service === 'dashboard') {
    const accessToken = request.headers.get('authorization')?.split(' ')[1];
    if (accessToken) {
      const sessionId = await decodeAccessToken(accessToken);

      if (sessionId) {
        const sessions = await db
          .select({ id: UserSessions.id, userId: UserSessions.userId })
          .from(UserSessions)
          .where(eq(UserSessions.id, sessionId));

        if (sessions.length > 0) {
          const [session] = sessions;

          ctx.session = {
            id: session.id,
            userId: session.userId,
          };
        }
      }
    }
  }

  if (service === 'usersite') {
    let site;

    if (env.USERSITE_OVERRIDE_ID) {
      site = await db
        .select({ id: Sites.id, teamId: Sites.teamId })
        .from(Sites)
        .where(and(eq(Sites.id, env.USERSITE_OVERRIDE_ID), eq(Sites.state, SiteState.ACTIVE)))
        .then(first);
    } else {
      const origin = request.headers.get('origin');
      if (origin) {
        const hostname = new URL(origin).hostname;

        if (hostname.endsWith(`.${env.USERSITE_DEFAULT_HOST}`)) {
          const slug = hostname.split('.')[0];

          site = await db
            .select({ id: Sites.id, teamId: Sites.teamId })
            .from(Sites)
            .where(and(eq(Sites.slug, slug), eq(Sites.state, SiteState.ACTIVE)))
            .then(first);
        } else {
          site = await db
            .select({ id: Sites.id, teamId: Sites.teamId })
            .from(Sites)
            .innerJoin(SiteCustomDomains, eq(Sites.id, SiteCustomDomains.siteId))
            .where(
              and(
                eq(SiteCustomDomains.domain, hostname),
                eq(SiteCustomDomains.state, SiteCustomDomainState.ACTIVE),
                eq(Sites.state, SiteState.ACTIVE),
              ),
            )
            .then(first);
        }
      }
    }

    if (site) {
      ctx.site = {
        id: site.id,
        teamId: site.teamId,
      };
    }
  }

  return ctx;
};
