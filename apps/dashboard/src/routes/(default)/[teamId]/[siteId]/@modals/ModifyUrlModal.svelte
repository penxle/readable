<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { getContext } from 'svelte';
  import { z } from 'zod';
  import { ReadableError } from '@/errors';
  import { dataSchemas } from '@/schemas';
  import { graphql } from '$graphql';
  import { TitledModal } from '$lib/components';

  type CategoryEntity = {
    __typename: 'Category';
    id: string;
    slug: string;
  };

  type PageEntity = {
    __typename: 'Page';
    id: string;
    slug: string;
    category: {
      id: string;
      slug: string;
    };
    // NOTE: maxDepth = 2
    parent?: {
      id: string;
      slug: string;
    } | null;
  };

  type Entity = PageEntity | CategoryEntity;
  type Props = {
    entity: Entity;
    open: boolean;
  };

  let { entity, open = $bindable() }: Props = $props();

  function getPrecedingPath(entity: Entity) {
    if (entity.__typename === 'Category') {
      return '/';
    } else {
      // NOTE: maxDepth = 2
      return entity.parent ? `/${entity.category.slug}/${entity.parent.slug}/` : `/${entity.category.slug}/`;
    }
  }

  let precedingPath = $state('');

  $effect(() => {
    if (open) {
      precedingPath = getPrecedingPath(entity);
    }
  });

  const site = getContext<{
    url: string;
  }>('site');

  const {
    form: updateCategorySlugForm,
    context: updateCategorySlugContext,
    setErrors: setCategorySlugErrors,
  } = createMutationForm({
    schema: z.object({
      categoryId: z.string(),
      slug: dataSchemas.page.slug,
    }),
    mutation: graphql(`
      mutation UpdateCategorySlug($input: UpdateCategorySlugInput!) {
        updateCategorySlug(input: $input) {
          id
          slug
        }
      }
    `),
    onSuccess: () => {
      open = false;
      toast.success('URL이 변경되었습니다');
      mixpanel.track('category:slug:update');
    },
    onError: (err) => {
      if (err instanceof ReadableError && err.message === 'page_slug_exists') {
        setCategorySlugErrors({ slug: '이미 존재하는 URL입니다' });
        return;
      }

      // TODO: 구체적인 에러 핸들링
      toast.error('알 수 없는 오류가 발생했습니다');
    },
  });

  const {
    form: updatePageSlugForm,
    context: updatePageSlugContext,
    setErrors: setPageSlugErrors,
  } = createMutationForm({
    schema: z.object({
      pageId: z.string(),
      slug: dataSchemas.page.slug,
    }),
    mutation: graphql(`
      mutation UpdatePageSlug($input: UpdatePageSlugInput!) {
        updatePageSlug(input: $input) {
          id
          slug
        }
      }
    `),
    onSuccess: () => {
      open = false;
      toast.success('URL이 변경되었습니다');
      mixpanel.track('page:slug:update');
    },
    onError: (err) => {
      if (err instanceof ReadableError && err.message === 'page_slug_exists') {
        setPageSlugErrors({ slug: '이미 존재하는 URL입니다' });
        return;
      }

      // TODO: 구체적인 에러 핸들링
      toast.error('알 수 없는 오류가 발생했습니다');
    },
  });

  const form = $derived(entity.__typename === 'Category' ? updateCategorySlugForm : updatePageSlugForm);
  const context = $derived(entity.__typename === 'Category' ? updateCategorySlugContext : updatePageSlugContext);
</script>

<TitledModal bind:open>
  {#snippet title()}
    URL 변경
  {/snippet}

  <FormProvider {context} {form}>
    <div class={flex({ direction: 'column', gap: '20px' })}>
      <p class={css({ textStyle: '13r', color: 'text.secondary' })}>
        URL은 사용자 지정이 가능합니다. <br />
        단, URL을 변경할 경우 기존 링크가 작동하지 않을 수 있으므로 주의해주세요
      </p>

      <input name={entity.__typename === 'Category' ? 'categoryId' : 'pageId'} type="hidden" value={entity.id} />

      <FormField name="" label="기존 URL">
        <TextInput readonly value={`${site.url}${precedingPath}${entity.slug}`} />
      </FormField>

      <FormField name="slug" label="새 URL">
        <div class={flex({ align: 'center' })}>
          <div
            class={css({
              flexShrink: '0',
              borderWidth: '1px',
              borderRightWidth: '0',
              borderColor: 'border.primary',
              borderTopLeftRadius: '10px',
              borderBottomLeftRadius: '10px',
              paddingX: '16px',
              paddingY: '10px',
              textStyle: '16m',
              color: 'text.tertiary',
              height: '43px',
              backgroundColor: 'surface.secondary',
              maxWidth: '400px',
              truncate: true,
            })}
          >
            {site.url}{precedingPath}
          </div>
          <TextInput
            name="slug"
            style={css.raw({ borderTopLeftRadius: '0', borderBottomLeftRadius: '0', flexGrow: '1' })}
            autofocus
            placeholder="acme-docs"
          />
        </div>
      </FormField>

      <Button size="lg" type="submit">URL 변경</Button>
    </div>
  </FormProvider>
</TitledModal>
