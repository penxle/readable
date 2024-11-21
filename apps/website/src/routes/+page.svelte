<script lang="ts">
  import { Helmet } from '@readable/ui/components';
  import A11ySection from './A11ySection.svelte';
  import ClientsSection from './ClientsSection.svelte';
  import CtaSection from './CtaSection.svelte';
  import DashboardSection from './DashboardSection.svelte';
  import Header from './Header.svelte';
  import HeroSection from './HeroSection.svelte';
  import HookingSection from './HookingSection.svelte';
  import MachineFriendlySection from './MachineFriendlySection.svelte';
  import SearchSection from './SearchSection.svelte';
  import WidgetSection from './WidgetSection.svelte';
</script>

<Helmet
  description="콘텐츠에만 집중하세요. 나머지는 리더블이 해드려요. 낡지 않는 가이드 문서를 지금 생성해 보세요"
  image={{ src: 'https://cdn.rdbl.app/opengraph/cover.png', size: 'large' }}
  title="이용자를 붙잡을 가이드 문서 만들기, 리더블"
  trailing={null}
/>

<Header theme="light" />

<HeroSection />

<HookingSection />

<WidgetSection />

<DashboardSection />

<SearchSection />

<MachineFriendlySection />

<A11ySection />

<ClientsSection />

<CtaSection />
