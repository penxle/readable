<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex, grid } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import MapIcon from '~icons/lucide/map';
  import ServerIcon from '~icons/lucide/server';
  import ShareIcon from '~icons/lucide/share';
  import Lighthouse from './Lighthouse.svelte';
  import SectionTitle from './SectionTitle.svelte';

  const cards = [
    {
      icon: ServerIcon,
      title: 'SSR',
      description: '검색엔진이 읽을 수 있도록 서버에서 HTML을 렌더링합니다',
    },
    {
      icon: MapIcon,
      title: '사이트맵',
      description: '검색엔진이 페이지를 쉽게 발견할 수 있도록 사이트맵을 자동 생성합니다',
    },
    {
      icon: ShareIcon,
      title: 'OpenGraph',
      description: '메신저와 소셜 미디어 링크 미리보기를 위한 OpenGraph 메타데이터를 자동 지원합니다',
    },
  ];
</script>

<div
  class={flex({
    flexDirection: 'column',
    alignItems: 'center',
    width: '960px',
    marginX: 'auto',
    paddingX: '20px',
    paddingTop: '80px',
    paddingBottom: '100px',
    lgDown: {
      width: 'full',
      paddingY: '54px',
    },
  })}
>
  <SectionTitle color="#13AC60">
    {#snippet subtitle()}
      SEO
    {/snippet}
    {#snippet title()}
      <span>
        누구나
        <br />
        찾아올 수 있는
      </span>
    {/snippet}
    {#snippet description()}
      <span>
        <span>별도의 설정 없이도&nbsp;</span>
        <em>접근성이 고려된 설계</em>
        <span>
          와 잘 만들어져 있는
          <br class={css({ hideBelow: 'md' })} />
          메타데이터 덕분에 검색 엔진에 잘 인덱싱될 수 있습니다
        </span>
        <div
          class={css({
            marginTop: '13px',
            fontSize: { base: '13px', lg: '14px' },
            fontWeight: '[500]',
            color: 'text.tertiary',
          })}
        >
          *라이트하우스 스코어
        </div>
      </span>
    {/snippet}
  </SectionTitle>

  <div
    class={grid({
      columns: 4,
      alignItems: 'flex-start',
      marginTop: '48px',
      marginX: 'auto',
      width: 'full',
      maxWidth: '960px',
      justifyContent: 'space-between',
      lgDown: {
        marginTop: '34px',
        gap: '16px',
      },
    })}
  >
    <Lighthouse title="Performance" />
    <Lighthouse title="Accessibility" />
    <Lighthouse title="Best Practices" />
    <Lighthouse title="SEO" />
  </div>

  <div
    class={flex({
      marginTop: '48px',
      justifyContent: 'space-between',
      width: 'full',
      maxWidth: '960px',
      mdDown: {
        marginTop: '34px',
        flexDirection: 'column',
        gap: '24px',
      },
    })}
  >
    {#each cards as card (card.title)}
      <div
        class={flex({
          maxWidth: '240px',
          flexDirection: 'column',
          gap: '6px',
          lgDown: {
            width: 'full',
            padding: '16px',
          },
        })}
      >
        <div
          class={flex({
            alignItems: 'center',
            gap: '8px',
            lgDown: {
              gap: '6px',
            },
          })}
        >
          <Icon style={css.raw({ color: '[#13AC60]', hideFrom: 'lg' })} icon={card.icon} size={20} />
          <Icon style={css.raw({ color: '[#13AC60]', hideBelow: 'lg' })} icon={card.icon} size={24} />

          <div
            class={css({
              fontSize: '22px',
              fontWeight: '[700]',
              lgDown: {
                fontSize: '16px',
              },
            })}
          >
            {card.title}
          </div>
        </div>

        <div
          class={css({
            fontSize: '16px',
            fontWeight: '[500]',
            color: 'text.tertiary',
            lgDown: {
              fontSize: '14px',
            },
          })}
        >
          {card.description}
        </div>
      </div>
    {/each}
  </div>
</div>
