<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { Helmet } from '@readable/ui/components';
  import HeroLight from '$assets/hero/light.svg?component';
  import A11ySection from './A11ySection.svelte';
  import ClientsSection from './ClientsSection.svelte';
  import CtaSection from './CtaSection.svelte';
  import DashboardSection from './DashboardSection.svelte';
  import Header from './Header.svelte';
  import HeroSection from './HeroSection.svelte';
  import HookingSection from './HookingSection.svelte';
  import MachineFriendlySection from './MachineFriendlySection.svelte';
  import SearchSection from './SearchSection.svelte';

  let heroSection: HTMLElement = $state();
  let dashboardSection: HTMLElement = $state();
  let darkSections = $derived([heroSection, dashboardSection].filter(Boolean));
</script>

<Helmet
  description="콘텐츠에만 집중하세요. 나머지는 리더블이 해드려요. 낡지 않는 가이드 문서를 지금 생성해 보세요"
  image={{ src: 'https://cdn.rdbl.app/opengraph/cover.png', size: 'large' }}
  title="이용자를 붙잡을 가이드 문서 만들기, 리더블"
  trailing={null}
/>

<HeroLight
  class={css({
    position: 'absolute',
    top: '-121px',
    left: '0',
    right: '0',
    marginX: 'auto',
    zIndex: '50',
    width: '1280px',
    height: '360px',
    lgDown: {
      width: 'full',
      height: '300px',
    },
  })}
/>

<Header {darkSections} theme="dark" />

<HeroSection bind:section={heroSection} />

<HookingSection />

<MachineFriendlySection />

<SearchSection />

<A11ySection />

<DashboardSection bind:section={dashboardSection} />

<ClientsSection />

<CtaSection />
