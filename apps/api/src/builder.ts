import SchemaBuilder from '@pothos/core';
import DataLoaderPlugin from '@pothos/plugin-dataloader';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import WithInputPlugin from '@pothos/plugin-with-input';
import ZodPlugin from '@pothos/plugin-zod';
import dayjs from 'dayjs';
import { GraphQLJSON } from 'graphql-scalars';
import * as R from 'remeda';
import { base64 } from 'rfc4648';
import { ReadableError } from './errors';
import type { Context, SiteContext, UserContext } from '@/context';

export const builder = new SchemaBuilder<{
  AuthContexts: {
    session: Context & UserContext;
    site: Context & SiteContext;
  };
  AuthScopes: {
    session: boolean;
    site: boolean;
  };
  Context: Context;
  DefaultInputFieldRequiredness: true;
  DefaultFieldNullability: false;
  Scalars: {
    Binary: { Input: Uint8Array; Output: Uint8Array };
    DateTime: { Input: dayjs.Dayjs; Output: dayjs.Dayjs };
    ID: { Input: string; Output: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JSON: { Input: any; Output: unknown };
  };
}>({
  defaultInputFieldRequiredness: true,
  defaultFieldNullability: false,

  plugins: [ScopeAuthPlugin, DataLoaderPlugin, SimpleObjectsPlugin, WithInputPlugin, ZodPlugin],

  scopeAuth: {
    authScopes: (context) => ({
      session: !!context.session,
      site: !!context.site,
    }),
    treatErrorsAsUnauthorized: true,
    authorizeOnSubscribe: true,
    unauthorizedError: (_, __, ___, result) =>
      new ReadableError({ code: 'unauthorized', message: result.message, status: 401 }),
  },

  withInput: {
    typeOptions: {
      name: ({ fieldName }) => `${R.capitalize(fieldName)}Input`,
    },
  },

  zod: {
    validationError: (error) =>
      new ReadableError({ code: 'validation_error', message: error.issues[0].message, status: 400 }),
  },
});

builder.queryType();
builder.mutationType();
builder.subscriptionType();

builder.addScalarType('JSON', GraphQLJSON);

builder.scalarType('Binary', {
  serialize: (value) => base64.stringify(value),
  parseValue: (value) => {
    if (typeof value === 'string') {
      return base64.parse(value);
    }

    throw new Error('Invalid binary value');
  },
});

builder.scalarType('DateTime', {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => {
    if (typeof value === 'string') {
      const d = dayjs(value);
      if (d.isValid()) {
        return d;
      }
    }

    throw new Error('Invalid datetime value');
  },
});

export type Builder = typeof builder;
