<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import { onMount } from 'svelte';
  import ChevronLeftIcon from '~icons/lucide/chevron-left';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import Branding from '$assets/dashboard-section/branding.svg?component';
  import Collaboration from '$assets/dashboard-section/collaboration.svg?component';
  import ContentUpdate from '$assets/dashboard-section/content-update.svg?component';
  import EditingExperience from '$assets/dashboard-section/editing-experience.webp';
  import ModifyUrl from '$assets/dashboard-section/modify-url.svg?component';

  let visible = $state(false);
  let containerEl = $state<HTMLDivElement>();
  let currentScroll = $state(0);
  let carouselEl = $state<HTMLDivElement>();

  const contents = [
    {
      title: '콘텐츠 최신화',
      description: '현재 운영중인 서비스의 변경사항을 지속적으로 추적하고 발행된 문서와의 불일치점을 찾아냅니다',
      badge: 'BETA',
      asset: ContentUpdate,
      assetStyle: css({
        marginTop: { base: '11px', lg: '40px' },
        marginLeft: { base: '38px', lg: '56px' },
        paddingTop: { base: '32px', lg: '28px' },
        paddingX: { base: '6px', lg: '24px' },
      }),
    },
    {
      title: '공동 편집',
      description: '실시간 공동 편집으로 문서를 함께 수정하고, 원하는 변경사항을 발행해 효율적으로 협업을 진행합니다',
      asset: Collaboration,
      assetStyle: css({
        marginLeft: { base: '36px', lg: '56px' },
        paddingY: { base: '54px', lg: '84px' },
        paddingLeft: { base: '9px', lg: '22px' },
        paddingRight: { base: '14px', lg: '21px' },
        lg: { marginTop: '17px' },
      }),
    },
    {
      title: '직관적인 편집 경험',
      description: '익숙한 블럭 기반 에디터를 통해 쉽고 효율적으로 콘텐츠를 작성할 수 있습니다',
      asset: EditingExperience,
      assetStyle: css({
        marginTop: { base: '25px', lg: '53px' },
        marginLeft: { base: '43px', lg: '66px' },
        paddingTop: { base: '16px', lg: '28px' },
        paddingLeft: { base: '20px', lg: '24px' },
        width: { base: '246px', lg: '320px' },
      }),
    },
    {
      title: '브랜딩',
      description:
        '색상 코드 하나만 지정하면 그 색상으로부터 파생된 여러 색상이 사이트의 적재적소에 적용됩니다. 일관된 브랜드 이미지를 사이트에 손쉽게 적용하고 사이트의 내용에 집중해 보세요.',
      asset: Branding,
      assetStyle: css({
        marginLeft: { base: '38px', lg: '56px' },
        paddingTop: { base: '18px', lg: '55px' },
        paddingLeft: { base: '20px', lg: '33px' },
        paddingRight: { base: '19px', lg: '32px' },
        paddingBottom: { base: '28px', lg: '54px' },
        lg: { marginTop: '17px' },
      }),
    },
    {
      title: '커스텀 URL',
      description:
        '커스텀 도메인과 클린 URL 기능을 제공합니다. 브랜드 연속성을 유지하며 새로운 시스템으로 쉽게 전환하고 의미있는 주소로 문서를 배포해 보세요.',
      asset: ModifyUrl,
      assetStyle: css({
        marginTop: { base: '11px', lg: '21px' },
        marginLeft: { base: '38px', lg: '56px' },
        paddingTop: { base: '16px', lg: '28px' },
        paddingLeft: { base: '20px', lg: '24px' },
      }),
    },
  ];

  function scrollNext() {
    if (!carouselEl) return;
    const containerWidth = carouselEl.clientWidth;
    const newScroll = currentScroll + containerWidth;
    carouselEl.scrollTo({ left: newScroll, behavior: 'smooth' });
  }

  function scrollPrev() {
    if (!carouselEl) return;

    const containerWidth = carouselEl.clientWidth;
    const newScroll = currentScroll - containerWidth;
    carouselEl.scrollTo({ left: newScroll, behavior: 'smooth' });
  }

  onMount(() => {
    if (containerEl) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          visible = true;
        }
      });

      observer.observe(containerEl);

      return () => observer.disconnect();
    }
  });
</script>

<div
  class={css({
    paddingY: '54px',
    backgroundColor: 'neutral.90',
    lg: { paddingTop: '80px', paddingBottom: '100px' },
  })}
>
  <div bind:this={containerEl} class={cx('animate', visible && 'loaded')}>
    <div
      class={css({
        marginX: 'auto',
        marginBottom: '20px',
        borderRadius: 'full',
        paddingX: '14px',
        paddingY: '6px',
        textStyle: '14sb',
        backgroundColor: 'neutral.0',
        width: 'fit',
      })}
    >
      협업
    </div>

    <h2
      class={css({
        paddingX: '20px',
        fontSize: { base: '28px', lg: '[36px]' },
        fontWeight: '[800]',
        color: 'white',
        textAlign: 'center',
      })}
    >
      원활한 협업과
      <br />
      스마트한 문서 관리
    </h2>

    <p
      class={css({
        marginTop: '16px',
        paddingX: '20px',
        color: 'white',
        textAlign: 'center',
        opacity: '80',
        lg: { textStyle: '18r' },
      })}
    >
      빨리 움직이는 팀을 위한 가이드 문서 도구,
      <br />
      실시간 협업과 간편한 설정으로 사용자들에게 사랑받는 사이트를 만들어보세요
    </p>
  </div>

  <div class={cx('animate', 'delayed-400', visible && 'loaded')}>
    <div class={css({ marginTop: { base: '48px', lg: '80px' }, overflow: 'hidden' })}>
      <div
        bind:this={carouselEl}
        class={flex({
          align: 'center',
          gap: { base: '16px', lg: '20px' },
          overflow: 'auto',
          scrollbar: 'hidden',
          scrollSnapType: 'x',
          scrollSnapStrictness: 'mandatory',
          _before: {
            display: 'block',
            content: '""',
            height: '1px',
            minWidth: {
              // max(calc((100vw - 960px) / 2 - carouselGap), calc(paddingX - carouselGap))
              base: '4px',
              lg: '[calc((100vw - 960px) / 2 - 20px)]',
            },
          },
          _after: {
            display: 'block',
            content: '""',
            height: '1px',
            minWidth: {
              // max(calc((100vw - 960px) / 2 - carouselGap), calc(paddingX - carouselGap))
              base: '4px',
              lg: '[calc((100vw - 960px) / 2 - 20px)]',
            },
          },
        })}
        onscroll={(e) => {
          currentScroll = e.currentTarget.scrollLeft;
        }}
      >
        {#each contents as { title, badge, description, asset, assetStyle } (title)}
          <div
            class={css({
              flexShrink: '0',
              borderWidth: '1px',
              borderColor: 'border.primary',
              borderRadius: '[20px]',
              paddingTop: { base: '22px', lg: '34px' },
              width: { base: '230px', lg: '376px' },
              height: { base: '284px', lg: '442px' },
              backgroundColor: 'surface.primary',
              scrollSnapAlign: 'center',
              overflow: 'hidden',
            })}
          >
            <div class={css({ paddingX: { base: '20px', lg: '32px' } })}>
              <p
                class={flex({
                  align: 'center',
                  gap: { base: '6px', lg: '8px' },
                  textStyle: { base: '15b', lg: '22b' },
                })}
              >
                {title}
                {#if badge}
                  <span
                    class={css({
                      borderRadius: 'full',
                      paddingX: { base: '7px', lg: '8px' },
                      paddingY: { base: '3px', lg: '4px' },
                      fontSize: { base: '10px', lg: '14px' },
                      fontWeight: 'bold',
                      color: 'neutral.0',
                      backgroundColor: 'neutral.50',
                    })}
                  >
                    {badge}
                  </span>
                {/if}
              </p>
              <p class={css({ marginTop: '10px', textStyle: { base: '13m', lg: '16m' }, color: 'text.tertiary' })}>
                {description}
              </p>
            </div>

            <div class={assetStyle}>
              {#if typeof asset === 'string'}
                <img alt={title} src={asset} />
              {:else}
                <Icon style={css.raw({ size: 'full' })} icon={asset} />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div
      class={flex({
        align: 'center',
        justify: 'flex-end',
        gap: '14px',
        marginTop: { base: '30px', lg: '36px' },
        marginX: 'auto',
        paddingRight: '20px',
        maxWidth: '1280px',
        hideBelow: 'lg',
      })}
    >
      <button
        class={css({
          borderRadius: 'full',
          paddingY: '8px',
          paddingLeft: '7px',
          paddingRight: '9px',
          color: 'neutral.80',
          backgroundColor: 'neutral.50',
          _disabled: { color: 'neutral.50', backgroundColor: 'neutral.80' },
        })}
        aria-label="이전"
        disabled={currentScroll <= 0}
        onclick={scrollPrev}
        type="button"
      >
        <Icon icon={ChevronLeftIcon} size={24} />
      </button>
      <button
        class={css({
          borderRadius: 'full',
          paddingY: '8px',
          paddingLeft: '9px',
          paddingRight: '7px',
          color: 'neutral.80',
          backgroundColor: 'neutral.50',
          _disabled: { color: 'neutral.50', backgroundColor: 'neutral.80' },
        })}
        aria-label="다음"
        disabled={carouselEl && currentScroll >= carouselEl.scrollWidth - carouselEl.clientWidth}
        onclick={scrollNext}
        type="button"
      >
        <Icon icon={ChevronRightIcon} size={24} />
      </button>
    </div>
  </div>
</div>
