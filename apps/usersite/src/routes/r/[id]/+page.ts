import type { RenderPage_Query_Variables } from './$graphql';

export const _RenderPage_Query_Variables: RenderPage_Query_Variables = ({ params }) => ({
  pageId: params.id,
});

export const _RenderPage_Query_Extensions = { cache: true };
