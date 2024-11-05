<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex, grid } from '@readable/styled-system/patterns';
  import { HorizontalDivider, Icon } from '@readable/ui/components';
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import CircleXIcon from '~icons/lucide/circle-x';
  import MessagesSquareIcon from '~icons/lucide/messages-square';
  import SearchIcon from '~icons/lucide/search';
  import SparklesIcon from '$assets/icons/sparkles.svg?component';
  import SectionTitle from './SectionTitle.svelte';
  import type { TransitionConfig } from 'svelte/transition';

  const cards = [
    {
      icon: SearchIcon,
      title: '실시간 문서 검색',
      description: `사용자가 입력한 키워드를 기반으로 가장 유사한 결과를 제공합니다.
한글 자소 단위의 정확도로 사용자가 의도한 바를 정확히 반영합니다.`,
    },
    {
      icon: MessagesSquareIcon,
      title: 'AI 피드백',
      description: `사용자들이 자주 찾지만 검색 결과가 없는 키워드를 분석해 제공합니다.
누락된 정보 없이 사용자에게 도움이 되는 사이트를 만들어 보세요.`,
      comingSoon: true,
    },
  ];

  const typewriter = (node: HTMLElement, { speed = 1, delay = 0, suffix = '' }): TransitionConfig => {
    const getAllTextNodes = (node: Node): Node[] => {
      if (node.nodeType === 3) {
        return [node];
      } else if (node.hasChildNodes()) {
        const list: Node[] = [];
        for (let child of node.childNodes) {
          for (const textNode of getAllTextNodes(child)) {
            list.push(textNode);
          }
        }

        return list;
      }

      return [];
    };

    const textNodes = getAllTextNodes(node);

    let totalLength = 0;
    const ranges = textNodes.map((textNode) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const text = textNode.textContent!.replaceAll(/\s+/g, ' ');

      const range = [totalLength, totalLength + text.length];
      totalLength += text.length;
      textNode.textContent = '';
      return { textNode, range, text };
    });

    let currentRangeIndex = 0;
    const getCurrentRange = (i: number) => {
      while (ranges[currentRangeIndex].range[1] < i && currentRangeIndex < ranges.length) {
        const { textNode, text } = ranges[currentRangeIndex];
        textNode.textContent = text;
        currentRangeIndex++;
      }
      return ranges[currentRangeIndex];
    };

    const duration = totalLength / (speed * 0.01);

    return {
      delay,
      duration,
      tick: (t) => {
        const progress = Math.trunc(totalLength * t);
        const { textNode, range, text } = getCurrentRange(progress);
        const [start, end] = range;
        const textLength = ((progress - start) / (end - start)) * text.length;

        textNode.textContent = textLength === text.length ? text : text.slice(0, textLength) + suffix;
      },
    };
  };

  let animateQuestion = $state(false);
  let animateAnswer = $state(false);
  let animatePages = $state(false);

  let containerEl = $state<HTMLDivElement>();

  onMount(() => {
    if (containerEl) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          animateQuestion = true;
        }
      });

      observer.observe(containerEl);

      return () => observer.disconnect();
    }
  });
</script>

<div class={css({ background: '[linear-gradient(180deg, #FFF 54.06%, #FDFAFF 100%)]' })}>
  <div
    class={css({
      width: '1280px',
      marginX: 'auto',
      paddingX: '20px',
      paddingY: '120px',
      lgDown: {
        width: 'full',
        paddingY: '84px',
      },
    })}
  >
    <SectionTitle>
      {#snippet subtitle()}
        <span class={css({ color: '[#9C3BE8]' })}>고객 만족</span>
      {/snippet}
      {#snippet title()}
        <span>
          실제로
          <br />
          도움이 되는
        </span>
      {/snippet}
      {#snippet description()}
        <span>
          <span>단순 키워드 검색만으로&nbsp;</span>
          <em>질문의 요지를 이해하는 AI 검색</em>
          <br class={css({ hideBelow: 'md' })} />
          <span>문서 내용을 기반으로 가장 유용한 답변을 제공합니다</span>
        </span>
      {/snippet}
    </SectionTitle>

    <div
      class={flex({
        marginTop: '100px',
        alignItems: 'flex-start',
        minHeight: { base: '260px', lg: '220px' },
        lgDown: {
          marginTop: '54px',
        },
      })}
    >
      <div
        bind:this={containerEl}
        class={flex({
          flexDirection: 'column',
          marginX: 'auto',
          borderRadius: { base: '16px', lg: '[22px]' },
          width: 'full',
          maxWidth: '867px',
          padding: '8px',
          backgroundColor: 'surface.primary',
          boxShadow: 'strong',
        })}
      >
        <div class={flex({ align: 'center', shrink: 0 })}>
          <div
            class={flex({
              alignItems: 'center',
              borderWidth: '2px',
              borderColor: '[#9C3BE8]',
              borderRadius: { base: '8px', lg: '14px' },
              paddingX: { base: '12px', lg: '18px' },
              textStyle: { base: '14m', lg: '16m' },
              backgroundColor: { base: 'white', _dark: 'darkgray.1000' },
              width: 'full',
              height: { base: '36px', lg: '49px' },
            })}
          >
            <span class={css({ padding: '2px', color: 'neutral.50' })}>
              <Icon style={css.raw({ hideFrom: 'lg' })} icon={SearchIcon} size={16} />
              <Icon style={css.raw({ hideBelow: 'lg' })} icon={SearchIcon} size={18} />
            </span>

            {#if animateQuestion}
              <p
                class={css({ marginLeft: '8px', width: 'full' })}
                onintroend={() => setTimeout(() => (animateAnswer = true), 500)}
                in:typewriter={{ speed: 5 }}
              >
                팀 이름을 변경하려면 어떻게 해야해?
              </p>
            {:else}
              <p class={css({ marginLeft: '8px', width: 'full' })}></p>
            {/if}

            <div class={css({ marginLeft: '14px', color: 'neutral.50' })}>
              <Icon style={css.raw({ hideFrom: 'lg' })} icon={CircleXIcon} size={16} />
              <Icon style={css.raw({ hideBelow: 'lg' })} icon={CircleXIcon} size={18} />
            </div>
          </div>
        </div>

        <div
          class={flex({
            gap: '12px',
            marginTop: '12px',
            paddingX: '18px',
            paddingY: '16px',
          })}
        >
          <Icon style={css.raw({ color: '[#9C3BE8]' })} icon={SparklesIcon} size={20} />

          <div>
            {#if animateAnswer}
              <p
                class={css({ textStyle: '14r' })}
                onintroend={() => (animatePages = true)}
                in:typewriter={{ speed: 10, suffix: '' }}
              >
                팀 이름을 변경하려면 팀 대시보드의 팀 설정 탭으로 이동해야 합니다.
                <br />
                여기서 팀의 기본 정보를 변경할 수 있으며, 팀 로고와 함께 팀 이름도 수정할 수 있습니다. 이러한 변경 사항은
                팀의 모든 멤버에게 적용되지만,
                <br />
                팀 로고와 팀 이름은 사이트에 노출되지 않습니다.
              </p>
            {:else}
              <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
                <circle
                  class="circle1"
                  cx="2"
                  cy="13"
                  fill="#9C3BE8"
                  fill-opacity="0.12"
                  r="2"
                  transform="rotate(180 2 13)"
                />
                <circle
                  class="circle2"
                  cx="10"
                  cy="13"
                  fill="#9C3BE8"
                  fill-opacity="0.46"
                  r="2"
                  transform="rotate(180 10 13)"
                />
                <circle
                  class="circle3"
                  cx="18"
                  cy="13"
                  fill="#9C3BE8"
                  fill-opacity="0.72"
                  r="2"
                  transform="rotate(180 18 13)"
                />
              </svg>
            {/if}

            {#if animatePages}
              <div in:fade={{ duration: 300, easing: cubicInOut }}>
                <HorizontalDivider style={css.raw({ marginTop: '12px', marginBottom: '8px' })} />

                <div>
                  <div class={flex({ gap: '6px', alignItems: 'center' })}>
                    <div
                      class={center({
                        size: '17px',
                        backgroundColor: 'neutral.30',
                        color: 'text.tertiary',
                        textStyle: '12sb',
                        borderRadius: 'full',
                      })}
                    >
                      1
                    </div>
                    <span
                      class={css({
                        textStyle: { base: '12r', lg: '13r' },
                        color: 'text.secondary',
                        textDecoration: 'underline',
                      })}
                    >
                      팀과 사이트
                    </span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div
      class={grid({
        marginTop: '100px',
        columns: { base: 1, md: 2 },
        gap: '15px',
        lgDown: {
          marginTop: '74px',
          gap: '40px',
        },
      })}
    >
      {#each cards as card (card.title)}
        <div
          class={flex({
            flexDirection: 'column',
            gap: '6px',
            flex: '1',
          })}
        >
          <div class={flex({ alignItems: 'center', gap: '8px', lgDown: { gap: '6px' } })}>
            <Icon style={css.raw({ color: '[#9C3BE8]', lgDown: { size: '20px' } })} icon={card.icon} size={24} />
            <div class={css({ fontSize: '22px', fontWeight: '[700]', lgDown: { fontSize: '15px' } })}>{card.title}</div>
            {#if card.comingSoon}
              <div
                class={center({
                  borderRadius: 'full',
                  backgroundColor: '[#A861E1]',
                  color: 'neutral.0',
                  paddingX: '8px',
                  paddingY: '4px',
                  fontSize: '14px',
                  fontWeight: '[700]',
                  textTransform: 'uppercase',
                  lgDown: {
                    paddingX: '7px',
                    paddingY: '3px',
                    fontSize: '10px',
                  },
                })}
              >
                Coming Soon
              </div>
            {/if}
          </div>

          <div
            class={css({
              fontSize: '16px',
              fontWeight: '[500]',
              color: 'text.tertiary',
              whiteSpace: 'pre-line',
              lgDown: {
                fontSize: '13px',
              },
            })}
          >
            {card.description}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  @keyframes bounce {
    0%,
    100% {
      cy: 13;
      opacity: 0.5;
    }
    50% {
      cy: 8;
      opacity: 1;
    }
  }

  .circle1,
  .circle2,
  .circle3 {
    animation: bounce 600ms ease-in-out infinite;
  }

  .circle1 {
    animation-delay: 0ms;
  }

  .circle2 {
    animation-delay: 100ms;
  }

  .circle3 {
    animation-delay: 200ms;
  }
</style>
