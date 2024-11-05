<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import EditorMockupImage from '$assets/hero/editor-mockup.webp';
  import SiteMockupImage from '$assets/hero/site-mockup.webp';
  import { env } from '$env/dynamic/public';
  import { withUtm } from '$lib/utm';
  import SegmentButtons from './SegmentButtons.svelte';

  type Props = {
    section: HTMLElement;
  };

  let { section = $bindable() }: Props = $props();

  const keywords = ['도움센터', '유저 가이드', '업데이트 노트', '개발자 문서'];

  let i = $state(0);
  let idx = $derived(i % keywords.length);

  let selectedHeroMockup = $state('site');
  let visible = $state(false);

  let interval: ReturnType<typeof setInterval>;
  onMount(() => {
    visible = true;

    setTimeout(() => {
      i += 1;
      interval = setInterval(() => {
        i += 1;
      }, 2000);
    }, 1000); // 1초 뒤에 시작

    return () => clearInterval(interval);
  });
</script>

<div
  bind:this={section}
  class={flex({
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'neutral.100',
    height: 'screen',
    minHeight: '1096px',
    overflow: 'hidden',
    color: 'white',
    paddingTop: '180px',
    lgDown: {
      minHeight: '1002px',
      paddingTop: '128px',
    },
    mdDown: {
      minHeight: '739px',
    },
  })}
>
  <div
    class={cx(
      'animate',
      visible && 'loaded',
      css({
        fontSize: { base: '32px', md: '[48px]', lg: '[64px]' },
        fontWeight: '[900]',
        textAlign: 'center',
        marginTop: 'auto',
        lineHeight: '[1.3]',
      }),
    )}
  >
    <div>이용자를 붙잡을</div>
    <div class={css({ position: 'relative' })}>
      &nbsp;
      {#key i}
        <div class={flex({ position: 'absolute', inset: '0', justifyContent: 'center' })}>
          <div
            class={flex({
              textGradient: 'to-b',
              gradientFrom: '[#FFCB9A 0%]',
              gradientTo: '[#FF5D00 83.5%]',
            })}
            in:fly={{ y: 50, opacity: 0 }}
            out:fly={{ y: -20, opacity: 0 }}
          >
            {keywords[idx]}
          </div>
        </div>
      {/key}
    </div>
    <div>만들기</div>
  </div>
  <div
    class={cx('animate', 'delayed-200', visible && 'loaded', flex({ flexDirection: 'column', alignItems: 'center' }))}
  >
    <div
      class={flex({
        marginTop: '40px',
        gap: '32px',
        alignItems: 'center',
        lgDown: {
          flexDirection: 'column',
          gap: '16px',
        },
      })}
    >
      <a
        class={flex({
          borderRadius: '10px',
          paddingX: '24px',
          paddingY: '10px',
          textStyle: '16sb',
          lgDown: {
            paddingX: '20px',
            paddingY: '9px',
            textStyle: '15sb',
          },
          color: 'white',
          backgroundColor: 'brand.600',
          _hover: { backgroundColor: 'brand.500' },
          _focusVisible: { backgroundColor: 'brand.500' },
          _active: { backgroundColor: 'brand.700' },
          _pressed: { backgroundColor: 'brand.700' },
        })}
        href={withUtm(env.PUBLIC_DASHBOARD_URL)}
        rel="noopener noreferrer"
        target="_blank"
      >
        30초만에 시작하기
      </a>
      <a
        class={flex({
          gap: '6px',
          alignItems: 'center',
          paddingY: '10px',
          paddingLeft: '8px',
          textStyle: '16sb',
          lgDown: {
            textStyle: '15sb',
          },
          color: 'white/80',
        })}
        href="/preview"
      >
        이사 신청하기
        <Icon icon={ChevronRightIcon} size={20} />
      </a>
    </div>
  </div>

  <!-- SegmentButtons과 목업 이미지 -->
  <div
    class={flex({
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 'auto',
    })}
  >
    <div class={cx('animate', 'delayed-400', visible && 'loaded')}>
      <div class={css({ marginTop: '60px', lgDown: { marginTop: '54px' } })}>
        <SegmentButtons
          items={[
            { label: '사이트', value: 'site' },
            { label: '에디터', value: 'editor' },
          ]}
          on:select={(value) => (selectedHeroMockup = value.detail)}
        />
      </div>
    </div>
    <div
      class={flex({
        position: 'relative',
        marginTop: '34px',
        width: 'full',
        maxWidth: '889px',
        height: '502px',
        marginX: 'auto',
        lgDown: {
          marginTop: '24px',
          justifyContent: 'center',
          width: 'full',
          height: 'auto',
          paddingX: '20px',
        },
      })}
    >
      <div class={cx('hero-image', visible && 'loaded')}>
        <img alt="사이트 이미지" hidden={selectedHeroMockup !== 'site'} src={SiteMockupImage} />
        <img alt="에디터 이미지" hidden={selectedHeroMockup !== 'editor'} src={EditorMockupImage} />
      </div>
    </div>
  </div>
</div>

<style>
  .animate {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(30px);
    transition:
      opacity 0.5s ease,
      filter 0.5s ease,
      transform 0.5s ease;
  }

  .animate.delayed-200 {
    transition-delay: 0.2s;
  }

  .animate.delayed-400 {
    transition-delay: 0.4s;
  }

  .animate.loaded {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }
  .hero-image {
    opacity: 0;
    filter: blur(5px);
    transform: translateY(100px) scale(1.04);
    transition:
      opacity 0.8s linear,
      filter 0.8s linear,
      transform 0.8s cubic-bezier(0.4, 0, 0.1, 1);
    transition-delay: 0.4s;
  }
  .hero-image img {
    margin: 0 auto;
  }

  .hero-image.loaded {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0) scale(1);
  }
</style>
