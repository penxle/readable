<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import KeyboardImage from '$assets/a11y-section/keyboard.svg?component';
  import ResponsiveImage from '$assets/a11y-section/responsive.svg?component';
  import ScreenReaderImage from '$assets/a11y-section/screen-reader.svg?component';
  import SectionTitle from './SectionTitle.svelte';

  let visible = $state(false);
  let animateEl = $state<HTMLDivElement>();

  const cards = [
    {
      image: KeyboardImage,
      title: '키보드 탐색',
      description: `키보드만으로도 완전히 탐색이 가능해
      웹 접근성 표준을 준수하고
      모두에게 더 편리한 경험을 제공합니다`,
    },
    {
      image: ScreenReaderImage,
      title: '스크린 리더 친화적',
      description: `시각 장애가 있는 사람 뿐만이 아니라
      고령자나 저시력자도 내용을 이해할 수 있으며,
      법적 요구사항을 충족합니다`,
    },
    {
      image: ResponsiveImage,
      title: '전 범위 디바이스 최적화',
      description: `다양한 기기와 화면 크기에서
      원활하게 사용할 수 있도록 최적화되었습니다`,
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
    paddingBottom: '120px',
    lgDown: {
      width: 'full',
      paddingY: '54px',
    },
  })}
>
  <SectionTitle {animateEl} color="#175DE5" bind:visible>
    {#snippet subtitle()}
      접근성
    {/snippet}
    {#snippet title()}
      <span>
        모두가
        <br />
        이용 가능한
      </span>
    {/snippet}
    {#snippet description()}
      <span>
        <span>리더블로 만들어진 사이트는</span>
        <em>&nbsp;다양한 사용자들이 문제 없이&nbsp;</em>
        <span>콘텐츠에 접근할 수 있도록 설계되었습니다.</span>
        <br />
        <span>
          어떤 기기를 사용하든지, 나이나 신체적 특성 등에 관계없이 원하는 내용을 손쉽게 찾아 읽을 수 있습니다.
        </span>
      </span>
    {/snippet}
  </SectionTitle>

  <div
    class={cx(
      'animate',
      'delayed-200',
      visible && 'loaded',
      flex({
        maxWidth: '960px',
        marginTop: '60px',
        gap: '16px',
        lgDown: { marginTop: '34px', flexWrap: 'wrap' },
        mdDown: { width: 'full', flexDirection: 'column' },
      }),
    )}
  >
    {#each cards as card (card.title)}
      <div class={flex({ flexDirection: 'column', gap: '10px' })}>
        <div
          class={flex({
            flexDirection: 'column',
            gap: '6px',
            flex: '1',
            height: '84px',
          })}
        >
          <div class={flex({ alignItems: 'center', gap: '8px' })}>
            <div class={css({ fontSize: '22px', fontWeight: '[700]', lgDown: { fontSize: '15px' } })}>
              {card.title}
            </div>
          </div>
          <div
            class={css({
              fontSize: '16px',
              fontWeight: '[500]',
              color: 'text.tertiary',
              lgDown: { fontSize: '14px' },
              md: { whiteSpace: 'pre-line' },
            })}
          >
            {card.description}
          </div>
        </div>

        <div class={center({ width: '293px', height: '177px', lgDown: { width: 'full' } })}>
          <card.image />
        </div>
      </div>
    {/each}
  </div>
</div>
