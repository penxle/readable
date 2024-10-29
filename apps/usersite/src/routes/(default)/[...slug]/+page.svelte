<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex, grid } from '@readable/styled-system/patterns';
  import { Helmet, Icon } from '@readable/ui/components';
  import { TiptapRenderer } from '@readable/ui/tiptap';
  import { getContext } from 'svelte';
  import MenuIcon from '~icons/lucide/menu';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { graphql } from '$graphql';
  import Breadcrumb from './Breadcrumb.svelte';
  import Toc from './Toc.svelte';
  import type { Writable } from 'svelte/store';

  $: query = graphql(`
    query PagePage_Query($path: String!) {
      publicSite {
        id
        name
      }

      publicPage(path: $path) {
        id
        slug

        content {
          id
          title
          content
          excerpt
        }

        ...PagePage_Breadcrumb_publicPage
      }
    }
  `);

  const updatePageView = graphql(`
    mutation PagePage_UpdatePageView_Mutation($input: UpdatePageViewInput!) {
      updatePageView(input: $input)
    }
  `);

  let headings: { level: number; text: string; scrollTop: number }[] = [];

  const blurEffect = getContext<Writable<boolean>>('blurEffect');
  const mobileNavOpen = getContext('mobileNavOpen');

  const reportPageView = async (pageId: string) => {
    const { getFingerprint } = await import('$lib/utils/fingerprint');
    const deviceId = await getFingerprint();

    await updatePageView({
      pageId,
      deviceId,
    });
  };

  $: if (browser) {
    reportPageView($query.publicPage.id);
  }
</script>

<Helmet
  description={$query.publicPage.content.excerpt}
  image={{
    src: `${env.PUBLIC_API_URL}/opengraph/pages/${$query.publicPage.id}.png`,
    size: 'large',
  }}
  title={$query.publicPage.content.title}
  trailing={$query.publicSite.name}
/>

<div class={flex({ flex: '1', direction: 'column' })}>
  <div
    class={flex({
      hideFrom: 'md',
      position: 'sticky',
      top: '64px',
      zIndex: '1',
      alignItems: 'center',
      gap: '8px',
      paddingX: '20px',
      paddingBottom: '12px',
      borderBottomWidth: '1px',
      borderBottomColor: 'border.secondary',
    })}
  >
    <div
      class={css({
        position: 'absolute',
        top: '-64px',
        left: '0',
        right: '0',
        bottom: '0',
        zIndex: '-1',
        transition: 'background',
        transitionDuration: '500ms',
        backgroundColor: $blurEffect ? 'surface.primary/60' : 'surface.primary',
        backdropFilter: 'auto',
        backdropBlur: '8px',
      })}
      aria-hidden="true"
    />
    <button aria-label="메뉴 열기" type="button" on:click={() => mobileNavOpen.set(true)}>
      <Icon style={css.raw({ color: 'text.secondary' })} icon={MenuIcon} size={20} />
    </button>
    <Breadcrumb _publicPage={$query.publicPage} />
  </div>
  <div
    class={grid({
      flex: '1',
      maxWidth: {
        base: '[820px]',
        lg: 'full',
      },
      paddingX: {
        base: '40px',
        smOnly: '20px',
      },
      paddingRight: {
        lgOnly: '0',
      },
      columns: {
        base: 1,
        lg: 2,
      },
      columnGap: '40px',
      gridTemplateAreas: {
        base: '"breadcrumb" "title" "content"',
        lg: '"breadcrumb toc" "title toc" "content toc"',
      },
      gridTemplateColumns: {
        base: '[1fr]',
        lg: '[minmax(1fr, 820px) 220px]',
      },
    })}
  >
    <div
      class={css({
        hideBelow: 'md',
        paddingTop: '38px',
        marginBottom: '24px',
        gridArea: 'breadcrumb',
        maxWidth: '720px',
      })}
    >
      <Breadcrumb _publicPage={$query.publicPage} />
    </div>
    <h1
      class={css({
        marginTop: { base: '32px', md: '16px' },
        textStyle: '34b',
        lineHeight: '[1.3]',
        marginBottom: '32px',
        gridArea: 'title',
        maxWidth: '720px',
      })}
    >
      {$query.publicPage.content.title}
    </h1>

    <div class={css({ hideBelow: 'lg', gridArea: 'toc' })}>
      <Toc {headings} />
    </div>

    <div
      class={css({
        gridArea: 'content',
        paddingBottom: '120px',
        maxWidth: '720px',
        smOnly: {
          // NOTE: width 이렇게 넣어주지 않으면 큰 표가 가로 스크롤을 만듦
          width: '[calc(100vw - 40px)]',
        },
      })}
    >
      {#key $query.publicPage.id}
        <TiptapRenderer
          content={$query.publicPage.content.content}
          on:tocUpdate={(e) => (headings = e.detail.headings)}
        />
      {/key}
    </div>
  </div>
</div>
