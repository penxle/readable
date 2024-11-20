<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { center, flex } from '@readable/styled-system/patterns';
  import { Button, Icon } from '@readable/ui/components';
  import { onMount } from 'svelte';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import DashboardMockupImage from '$assets/hero/dashboard-mockup.webp';
  import SiteMockupImage from '$assets/hero/site-mockup.webp';
  import WidgetMockupImage from '$assets/hero/widget-mockup.webp';
  import { env } from '$env/dynamic/public';
  import { withUtm } from '$lib/utm';
  import Tabs from './Tabs.svelte';

  let selectedHeroMockup = $state('dashboard');
  let visible = $state(false);

  onMount(() => {
    visible = true;
  });
</script>

<div
  class={flex({
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: '60px',
    paddingX: '20px',
    paddingY: '120px',
    mdDown: {
      paddingY: '54px',
    },
  })}
>
  <div
    class={cx(
      'animate',
      visible && 'loaded',
      css({
        fontSize: { base: '[34px]', md: '[40px]', lg: '[44px]' },
        fontWeight: '[800]',
        textAlign: 'center',
        marginTop: 'auto',
        lineHeight: '[1.3]',
      }),
    )}
  >
    <div>
      도움센터, <br />
      드디어 읽히다.
    </div>
  </div>
  <div
    class={cx(
      'animate',
      'delayed-200',
      visible && 'loaded',
      flex({ width: 'full', flexDirection: 'column', alignItems: 'center' }),
    )}
  >
    <div
      class={flex({
        marginTop: '40px',
        gap: '12px',
        alignItems: 'center',
        lgDown: {
          flexDirection: 'column',
        },
        smOnly: {
          width: 'full',
          '& > a': {
            width: 'full',
          },
        },
      })}
    >
      <Button
        glossy
        href={withUtm(env.PUBLIC_DASHBOARD_URL)}
        rel="noopener noreferrer"
        size="lg"
        target="_blank"
        type="link"
      >
        30초만에 시작하기
      </Button>
      <Button href="/preview" size="lg" type="link" variant="secondary">
        이사 신청하기
        <Icon icon={ChevronRightIcon} size={20} />
      </Button>
    </div>
  </div>

  <div
    class={flex({
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '64px',
    })}
  >
    <div class={cx('animate', 'delayed-400', visible && 'loaded', center({ width: 'full' }))}>
      <Tabs
        items={[
          { label: '대시보드', value: 'dashboard' },
          { label: '사이트', value: 'site' },
          { label: '위젯', value: 'widget' },
        ]}
        onselect={(value) => (selectedHeroMockup = value)}
      />
    </div>
    <div
      class={flex({
        position: 'relative',
        marginTop: '24px',
        width: 'full',
        maxWidth: '960px',
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
      <div
        class={cx(
          'hero-image',
          visible && 'loaded',
          css({
            borderRadius: '[20px]',
            smOnly: {
              borderRadius: '10px',
            },
            borderWidth: '1px',
            borderColor: 'border.secondary',
            boxShadow: '[0px 20px 44px -10px rgba(74, 68, 65, 0.08)]',
          }),
        )}
      >
        <img alt="대시보드 이미지" hidden={selectedHeroMockup !== 'dashboard'} src={DashboardMockupImage} />
        <img alt="사이트 이미지" hidden={selectedHeroMockup !== 'site'} src={SiteMockupImage} />
        <img alt="위젯 이미지" hidden={selectedHeroMockup !== 'widget'} src={WidgetMockupImage} />
      </div>
    </div>
  </div>
</div>

<style>
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
