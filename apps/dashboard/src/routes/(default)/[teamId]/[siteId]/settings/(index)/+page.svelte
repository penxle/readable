<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import {
    Button,
    FormField,
    FormProvider,
    FormValidationMessage,
    Helmet,
    Icon,
    TextInput,
  } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import InfoIcon from '~icons/lucide/info';
  import TriangleAlertIcon from '~icons/lucide/triangle-alert';
  import UploadIcon from '~icons/lucide/upload';
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { graphql } from '$graphql';
  import { LoadableImg } from '$lib/components';
  import { invokeAlert } from '$lib/components/invoke-alert';
  import TitledModal from '$lib/components/TitledModal.svelte';
  import { uploadBlobAsImage } from '$lib/utils/blob.svelte';

  let deleteSiteOpen = $state(false);

  let inputEl = $state<HTMLInputElement>();

  const query = graphql(`
    query SiteSettingsIndexPage_Query($siteId: ID!) {
      site(siteId: $siteId) {
        id
        name
        slug
        themeColor

        logo {
          id
          ...Img_image
        }
      }
    }
  `);

  const updateSite = graphql(`
    mutation SiteSettingsIndexPage_UpdateSite_Mutation($input: UpdateSiteInput!) {
      updateSite(input: $input) {
        id
        slug
        name
        url

        logo {
          id
        }
      }
    }
  `);

  const deleteSite = graphql(`
    mutation SiteSettingsIndexPage_DeleteSite_Mutation($input: DeleteSiteInput!) {
      deleteSite(input: $input) {
        id
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
    mutation: async ({ name, logoId }) => {
      await updateSite({
        siteId: $query.site.id,
        name,
        slug: $query.site.slug,
        themeColor: $query.site.themeColor,
        logoId,
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      toast.success('사이트 설정이 변경되었습니다');
      mixpanel.track('site:update', {
        fields: ['name', 'logo'],
      });
    },
  });

  const {
    form: slugForm,
    isDirty: slugFormIsDirty,
    setIsDirty: setSlugFormIsDirty,
    setInitialValues: setSlugInitialValues,
    context: slugFormContext,
  } = createMutationForm({
    schema: z.object({
      siteId: z.string(),
      name: dataSchemas.site.name,
      slug: dataSchemas.site.slug,
      themeColor: dataSchemas.site.themeColor,
      logoId: z.string().optional(),
    }),
    mutation: async ({ slug }) => {
      invokeAlert({
        title: '사이트 주소를 변경하시겠어요?',
        content: '사이트 주소가 변경되면 기존 주소로는 접근할 수 없습니다',
        action: '변경',
        onaction: async () => {
          await updateSite({
            siteId: $query.site.id,
            name: $query.site.name,
            slug,
            themeColor: $query.site.themeColor,
            logoId: $query.site.logo?.id,
          });

          setSlugFormIsDirty(false);
          toast.success('사이트 주소가 변경되었습니다');
          mixpanel.track('site:update', {
            fields: ['slug'],
          });
        },
        variant: 'primary',
      });
    },
  });

  const {
    form: deleteForm,
    data: deleteFormData,
    context: deleteFormContext,
  } = createMutationForm({
    schema: z.object({
      siteId: z.string(),
      siteName: z.string(),
    }),
    mutation: async ({ siteId }) => {
      await deleteSite({ siteId });
      mixpanel.track('site:delete');
      await goto('/');
    },
  });

  setInitialValues({
    siteId: $query.site.id,
    name: $query.site.name,
    slug: $query.site.slug,
    themeColor: $query.site.themeColor,
    logoId: $query.site.logo?.id,
  });

  setSlugInitialValues({
    siteId: $query.site.id,
    name: $query.site.name,
    slug: $query.site.slug,
    themeColor: $query.site.themeColor,
    logoId: $query.site.logo?.id,
  });
</script>

<Helmet title="사이트 설정" trailing={$query.site.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>일반</h1>

<FormProvider
  class={css({
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
  <p class={css({ marginBottom: '8px', textStyle: '14sb', color: { base: 'gray.700', _dark: 'gray.300' } })}>
    사이트 로고
  </p>

  <div class={css({ position: 'relative', size: '64px', _hover: { '& > div': { display: 'flex' } } })}>
    <button
      onclick={() => {
        inputEl?.click();
      }}
      type="button"
    >
      {#if $data.logoId}
        <LoadableImg
          id={$data.logoId}
          style={css.raw({ size: '64px', borderWidth: '1px', borderColor: 'border.image', borderRadius: '10px' })}
          alt="사이트 로고"
          size={64}
        />
      {:else}
        <div
          class={center({
            size: '64px',
            borderWidth: '1px',
            borderColor: 'border.image',
            borderRadius: '10px',
            color: 'neutral.60',
            backgroundColor: 'neutral.20',
          })}
        >
          <Icon icon={UploadIcon} size={28} />
        </div>
      {/if}
    </button>

    <div
      class={css({
        position: 'absolute',
        top: '0',
        left: '0',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        color: $data.logoId ? 'neutral.0' : 'neutral.60',
        backgroundColor: 'neutral.100/16',
        size: '64px',
        pointerEvents: 'none',
      })}
    >
      <Icon icon={UploadIcon} size={28} />
    </div>
  </div>

  <input
    bind:this={inputEl}
    class={css({ display: 'none' })}
    accept="image/*"
    onchange={async (event) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = '';
      if (!file) {
        return;
      }

      const resp = await uploadBlobAsImage(file, {
        ensureAlpha: true,
        resize: { width: 512, height: 512, fit: 'contain', background: '#00000000' },
        format: 'png',
      });

      $data.logoId = resp.id;
      setIsDirty(true);
    }}
    type="file"
  />

  <FormField name="name" style={css.raw({ marginTop: '24px' })} label="사이트 이름">
    <TextInput placeholder="ACME 도움센터" />
  </FormField>

  <div class={flex({ marginTop: '8px', gap: '8px', justifyContent: 'flex-end' })}>
    {#if $isDirty}
      <Button size="lg" type="reset" variant="secondary">되돌리기</Button>
    {/if}
    <Button disabled={!$isDirty} size="lg" type="submit">변경</Button>
  </div>
</FormProvider>

<FormProvider
  class={css({
    marginTop: '8px',
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '10px',
    padding: '32px',
    width: 'full',
    maxWidth: '720px',
    backgroundColor: 'surface.primary',
  })}
  context={slugFormContext}
  form={slugForm}
>
  <label
    class={css({
      display: 'block',
      marginBottom: '8px',
      textStyle: '14sb',
      color: { base: 'gray.700', _dark: 'gray.300' },
    })}
    for="slug"
  >
    사이트 주소
  </label>

  <div class={flex({ align: 'center' })}>
    <TextInput
      name="slug"
      style={css.raw({ borderTopRightRadius: '0', borderBottomRightRadius: '0', width: 'full' })}
      placeholder="acme-docs"
    />

    <div
      class={css({
        borderWidth: '1px',
        borderLeftWidth: '0',
        borderColor: 'border.primary',
        borderTopRightRadius: '10px',
        borderBottomRightRadius: '10px',
        paddingX: '20px',
        paddingY: '10px',
        textStyle: '16m',
        color: 'text.tertiary',
        height: '43px',
        backgroundColor: 'surface.secondary',
      })}
    >
      .{env.PUBLIC_USERSITE_DEFAULT_HOST}
    </div>
  </div>

  <div
    class={flex({
      align: 'center',
      justify: 'space-between',
      gap: '4px',
      height: '17px',
      textStyle: '12r',
      marginTop: '4px',
      color: { base: 'red.600', _dark: 'red.500' },
    })}
  >
    <div class={flex({ align: 'center', gap: '4px' })}>
      <FormValidationMessage for="slug">
        {#snippet children({ message })}
          <Icon icon={InfoIcon} size={12} />
          {message}
        {/snippet}
      </FormValidationMessage>
    </div>
  </div>

  <div class={flex({ marginTop: '8px', gap: '8px', justifyContent: 'flex-end' })}>
    {#if $slugFormIsDirty}
      <Button size="lg" type="reset" variant="secondary">되돌리기</Button>
    {/if}
    <Button disabled={!$slugFormIsDirty} size="lg" type="submit">변경</Button>
  </div>
</FormProvider>

<div
  class={css({
    marginTop: '8px',
    borderWidth: '1px',
    borderColor: 'border.primary',
    borderRadius: '10px',
    padding: '32px',
    width: 'full',
    maxWidth: '720px',
    backgroundColor: 'surface.primary',
  })}
>
  <label
    class={css({
      display: 'block',
      marginBottom: '8px',
      textStyle: '14sb',
      color: 'text.danger',
    })}
    for="slug"
  >
    사이트 삭제
  </label>

  <p
    class={css({
      color: 'text.tertiary',
      marginTop: '6px',
      textStyle: '13r',
    })}
  >
    사이트 삭제시 모든 데이터가 영구적으로 삭제되며, 삭제된 데이터는 복구할 수 없습니다.
  </p>

  <Button
    style={css.raw({ marginTop: '8px', marginLeft: 'auto' })}
    onclick={() => {
      deleteSiteOpen = true;
    }}
    size="lg"
    type="submit"
    variant="danger-fill"
  >
    삭제
  </Button>
</div>

<TitledModal bind:open={deleteSiteOpen}>
  {#snippet title()}
    사이트 삭제
  {/snippet}

  <p
    class={css({
      color: 'text.tertiary',
      textStyle: '13r',
    })}
  >
    사이트 삭제시 모든 데이터가 영구적으로 삭제되며, 삭제된 데이터는 복구할 수 없습니다. <br />
    삭제를 진행하시려면 아래 사이트 이름을 입력해 주세요.
  </p>

  <div
    class={flex({
      align: 'center',
      gap: '6px',
      marginTop: '10px',
      borderRadius: '8px',
      paddingX: '10px',
      paddingY: '8px',
      textStyle: '13m',
      color: 'text.danger',
      backgroundColor: 'danger.10',
      '& b': {
        textStyle: '13b',
      },
    })}
  >
    <Icon icon={TriangleAlertIcon} />
    <p>
      삭제를 진행하시려면 아래에 다음 문구를 입력해주세요:
      <b>{$query.site.name}</b>
    </p>
  </div>

  <FormProvider context={deleteFormContext} form={deleteForm}>
    <input name="siteId" type="hidden" value={$query.site.id} />

    <FormField name="siteName" style={css.raw({ marginTop: '20px' })} label="사이트 이름">
      <TextInput name="siteName" placeholder={$query.site.name} />
    </FormField>

    <Button
      style={css.raw({ width: 'full', marginTop: '20px' })}
      disabled={$deleteFormData.siteName !== $query.site.name}
      size="lg"
      type="submit"
      variant="danger-fill"
    >
      삭제
    </Button>
  </FormProvider>
</TitledModal>
