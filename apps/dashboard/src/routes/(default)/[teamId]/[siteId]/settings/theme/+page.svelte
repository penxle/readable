<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, Helmet, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import { graphql } from '$graphql';
  import { LiteBadge } from '$lib/components';

  const query = graphql(`
    query SiteSettingsThemePage_Query($siteId: ID!) {
      site(siteId: $siteId) {
        id
        name
        slug
        themeColor

        logo {
          id
        }

        team {
          id

          plan {
            id

            plan {
              id

              rules {
                themeColor
              }
            }
          }
        }
      }
    }
  `);

  const updateSite = graphql(`
    mutation SiteSettingsThemePage_UpdateSite_Mutation($input: UpdateSiteInput!) {
      updateSite(input: $input) {
        id
        slug
        name

        logo {
          id
        }
      }
    }
  `);

  const { form, data, isDirty, setIsDirty, setInitialValues, context } = createMutationForm({
    schema: z.object({
      siteId: z.string(),
      name: dataSchemas.site.name,
      slug: dataSchemas.site.slug,
      themeColor: dataSchemas.site.themeColor,
      logoId: z.string().optional(),
    }),
    mutation: async ({ themeColor }) => {
      await updateSite({
        siteId: $query.site.id,
        name: $query.site.name,
        slug: $query.site.slug,
        themeColor,
        logoId: $query.site.logo?.id,
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      toast.success('사이트 테마 색상이 변경되었습니다');
      mixpanel.track('site:update', {
        fields: ['themeColor'],
      });
    },
  });

  setInitialValues({
    siteId: $query.site.id,
    name: $query.site.name,
    slug: $query.site.slug,
    themeColor: $query.site.themeColor,
    logoId: $query.site.logo?.id,
  });
</script>

<Helmet title="테마 설정" trailing={$query.site.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>테마 색상</h1>

<FormProvider
  class={css({
    marginBottom: '8px',
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '10px',
    padding: '32px',
    width: 'full',
    maxWidth: '720px',
    backgroundColor: 'surface.primary',
  })}
  {context}
  {form}
>
  <FormField name="themeColor" label="테마 색상">
    {#snippet labelSuffix()}
      <LiteBadge via="site-theme-color:lite-badge" />
    {/snippet}

    <TextInput
      disabled={!$query.site.team.plan.plan.rules.themeColor}
      oninput={(e) => {
        if (e.currentTarget.value[0] !== '#') {
          e.currentTarget.value = `#${e.currentTarget.value}`;
        }
      }}
    >
      {#snippet leftItem()}
        <div
          style:background={$data.themeColor}
          class={css({ borderWidth: '1px', borderColor: 'border.image', borderRadius: 'full', size: '20px' })}
        ></div>
      {/snippet}
    </TextInput>
  </FormField>

  <div class={flex({ marginTop: '8px', gap: '8px', justifyContent: 'flex-end' })}>
    {#if $isDirty}
      <Button size="lg" type="reset" variant="secondary">되돌리기</Button>
    {/if}
    <Button disabled={!$isDirty} size="lg" type="submit">변경</Button>
  </div>
</FormProvider>
