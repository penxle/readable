<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { scrollLock } from '@readable/ui/actions';
  import { Button, Icon } from '@readable/ui/components';
  import { writable } from 'svelte/store';
  import ExternalLinkIcon from '~icons/lucide/external-link';
  import MenuIcon from '~icons/lucide/menu';
  import CloseIcon from '~icons/lucide/x';
  import { beforeNavigate } from '$app/navigation';
  import FullLogo from '$assets/logos/full.svg';
  import FullWhiteLogo from '$assets/logos/full-white.svg';
  import { env } from '$env/dynamic/public';
  import { withUtm } from '$lib/utm';

  type Props = {
    theme: HeaderTheme;
    darkSections?: HTMLElement[];
  };

  let { theme, darkSections = [] }: Props = $props();

  type HeaderTheme = 'light' | 'dark';

  let scrollY = $state(0);
  let headerElem = $state<HTMLHeadElement>();

  const headerTheme = writable<HeaderTheme>(theme);
  const isMenuOpen = writable(false);

  function toggleMenu() {
    $isMenuOpen = !$isMenuOpen;
  }

  $effect(() => {
    if (darkSections.length > 0 && headerElem) {
      let currentTheme: HeaderTheme = 'light';

      const headerHeight = headerElem.offsetHeight;
      for (const section of darkSections) {
        if (
          section.offsetTop - headerHeight < scrollY &&
          section.offsetTop + section.offsetHeight - headerHeight > scrollY
        ) {
          currentTheme = 'dark';
          break;
        }
      }

      headerTheme.set(currentTheme);
    }
  });

  beforeNavigate(() => {
    $isMenuOpen = false;
  });
</script>

<svelte:window bind:scrollY />

<header
  bind:this={headerElem}
  class={flex({
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    height: '60px',
    lgDown: {
      height: '64px',
      paddingX: '20px',
    },
    zIndex: '100',
    backgroundColor: scrollY > 64 ? ($headerTheme === 'dark' ? 'neutral.100' : 'white/90') : 'transparent',
    backdropFilter: 'auto',
    backdropBlur: scrollY > 64 ? '[20px]' : '[0px]',
    transition: '[all 500ms cubic-bezier(0.3, 0, 0, 1)]',
  })}
>
  <div
    class={css(
      flex.raw({
        alignItems: 'center',
        justifyContent: 'space-between',
        marginX: 'auto',
        borderBottomWidth: '1px',
        borderBottomColor: 'transparent',
        width: '1080px',
      }),
      scrollY > 64 && {
        borderBottomColor: $headerTheme === 'dark' ? 'gray.800/40' : 'gray.300/40',
      },
    )}
  >
    <a href="/">
      <img
        class={css({
          height: '22px',
          lgDown: {
            height: '18px',
          },
        })}
        alt="Readable"
        src={$headerTheme === 'dark' ? FullWhiteLogo : FullLogo}
      />
    </a>

    <div
      class={flex({
        gap: '48px',
        '& a': {
          textStyle: '15b',
          color: $headerTheme === 'dark' ? '[#E4E4E7]' : 'text.secondary',
          paddingX: '16px',
          paddingY: '13px',
        },
        lgDown: {
          display: 'none',
        },
      })}
    >
      <a class={css({ display: 'inline-block' })} href="/pricing">가격 안내</a>
      <a
        class={flex({ align: 'center', gap: '6px' })}
        href="https://docs.rdbl.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>이용 가이드</span>
        <Icon icon={ExternalLinkIcon} size={14} />
      </a>
      <a
        class={flex({ align: 'center', gap: '6px' })}
        href="https://updates.rdbl.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>업데이트 노트</span>
        <Icon icon={ExternalLinkIcon} size={14} />
      </a>
      <a class={css({ display: 'inline-block' })} href="/preview">이사 신청</a>
    </div>

    <div class={flex({ gap: '8px', lgDown: { display: 'none' } })}>
      <a
        class={center({
          borderRadius: '8px',
          paddingX: '20px',
          paddingY: '9px',
          textStyle: '14sb',
          height: '38px',
          borderWidth: '1px',
          ...($headerTheme === 'dark'
            ? {
                borderColor: 'darkgray.800',
                color: 'darkgray.200',
                backgroundColor: 'darkgray.800',
                _hover: { backgroundColor: 'darkgray.700' },
                _focusVisible: { backgroundColor: 'darkgray.700' },
                _active: { backgroundColor: 'darkgray.900' },
                _pressed: { backgroundColor: 'darkgray.900' },
              }
            : {
                borderColor: 'gray.300',
                color: 'gray.700',
                backgroundColor: 'white',
                _hover: { backgroundColor: 'gray.100' },
                _focusVisible: { backgroundColor: 'gray.100' },
                _active: { backgroundColor: 'gray.300' },
                _pressed: { backgroundColor: 'gray.300' },
              }),
        })}
        href="/contact"
      >
        도입 문의
      </a>
      <a
        class={center({
          borderRadius: '8px',
          paddingX: '20px',
          paddingY: '9px',
          textStyle: '14sb',
          height: '38px',
          color: 'white',
          backgroundColor: 'brand.600',
          _hover: { backgroundColor: 'brand.500' },
          _focusVisible: { backgroundColor: 'brand.500' },
          _active: { backgroundColor: 'brand.700' },
          _pressed: { backgroundColor: 'brand.700' },
        })}
        href={withUtm(env.PUBLIC_DASHBOARD_URL)}
      >
        로그인
      </a>
    </div>

    <button
      class={flex({ lgOnly: { display: 'none' }, color: $headerTheme === 'dark' ? 'white' : 'gray.1000' })}
      onclick={toggleMenu}
      type="button"
    >
      <Icon icon={$isMenuOpen ? CloseIcon : MenuIcon} size={24} />
    </button>
  </div>
</header>

{#if $isMenuOpen}
  <div
    class={flex({
      direction: 'column',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'white',
      zIndex: '[200]',
    })}
    use:scrollLock
  >
    <div class={css({ paddingX: '20px' })}>
      <div
        class={flex({
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingY: '20px',
          maxWidth: '1080px',
          marginX: 'auto',
        })}
      >
        <a href="/">
          <img
            class={css({
              height: '22px',
              lgDown: {
                height: '18px',
              },
            })}
            alt="Readable"
            src={FullLogo}
          />
        </a>
        <button onclick={toggleMenu} type="button">
          <Icon icon={CloseIcon} size={24} />
        </button>
      </div>
    </div>
    <div
      class={flex({
        flexDirection: 'column',
        grow: '1',
        width: 'full',
        maxWidth: '1080px',
        marginX: 'auto',
      })}
    >
      <nav
        class={flex({
          flexDirection: 'column',
          '& > a': {
            textStyle: '16sb',
            paddingX: '16px',
            paddingY: '20px',
            color: 'text.secondary',
          },
        })}
      >
        <a href="/pricing">가격 안내</a>
        <a
          class={flex({ align: 'center', gap: '6px' })}
          href="https://docs.rdbl.io"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>이용 가이드</span>
          <Icon icon={ExternalLinkIcon} size={14} />
        </a>
        <a
          class={flex({ align: 'center', gap: '6px' })}
          href="https://updates.rdbl.io"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>업데이트 노트</span>
          <Icon icon={ExternalLinkIcon} size={14} />
        </a>
        <a href="/preview">이사 신청</a>
      </nav>
      <div
        class={flex({
          marginTop: 'auto',
          flexDirection: 'column',
          gap: '8px',
          padding: '20px',
          paddingBottom: '40px',
        })}
      >
        <Button href="/contact" size="lg" type="link" variant="secondary">도입 문의</Button>
        <Button href={withUtm(env.PUBLIC_DASHBOARD_URL)} size="lg" type="link">로그인</Button>
      </div>
    </div>
  </div>
{/if}
