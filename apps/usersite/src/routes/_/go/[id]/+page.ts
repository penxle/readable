import { redirect } from '@sveltejs/kit';
import { pageUrl } from '$lib/utils/url';
import type { GoPage_Query_AfterLoad, GoPage_Query_Variables } from './$graphql';

export const _GoPage_Query_Variables: GoPage_Query_Variables = ({ params }) => ({
  pageId: params.id,
});

export const _GoPage_Query_AfterLoad: GoPage_Query_AfterLoad = (query) => {
  redirect(302, pageUrl(query.publicPageById));
};

export const _GoPage_Query_Extensions = { cache: true };
