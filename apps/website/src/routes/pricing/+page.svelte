<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex, grid } from '@readable/styled-system/patterns';
  import { Button, Helmet, HorizontalDivider, Icon, Tooltip } from '@readable/ui/components';
  import CheckCircle2Icon from '~icons/lucide/check-circle-2';
  import CircleHelpIcon from '~icons/lucide/circle-help';
  import ClipboardListIcon from '~icons/lucide/clipboard-list';
  import ContactIcon from '~icons/lucide/contact';
  import EllipsisIcon from '~icons/lucide/ellipsis';
  import FileSignatureIcon from '~icons/lucide/file-signature';
  import FilesIcon from '~icons/lucide/files';
  import HeadphonesIcon from '~icons/lucide/headphones';
  import LinkIcon from '~icons/lucide/link';
  import MonitorSmartphoneIcon from '~icons/lucide/monitor-smartphone';
  import MousePointerClickIcon from '~icons/lucide/mouse-pointer-click';
  import PaintbrushIcon from '~icons/lucide/paintbrush';
  import RefreshCwIcon from '~icons/lucide/refresh-cw';
  import SearchIcon from '~icons/lucide/search';
  import SettingsIcon from '~icons/lucide/settings';
  import UserCogIcon from '~icons/lucide/user-cog';
  import UserRoundIcon from '~icons/lucide/user-round';
  import UsersRoundIcon from '~icons/lucide/users-round';
  import WrenchIcon from '~icons/lucide/wrench';
  import HeroLight from '$assets/hero/light.svg?component';
  import { env } from '$env/dynamic/public';
  import { withUtm } from '$lib/utm';
  import Header from '../Header.svelte';
  import SegmentButtons from '../SegmentButtons.svelte';
  import type { Component } from 'svelte';

  let selectedPrice = $state('yearly');
  let darkSection = $state<HTMLElement>();

  type Feature = {
    icon: Component;
    feature: string;
    tooltipMessage?: string;
  };

  type Plan = {
    name: string;
    price: string;
    features: Feature[];
  };

  const plans: Plan[] = $derived([
    {
      name: 'Starter',
      price: '무료',
      features: [
        { icon: UserRoundIcon, feature: '1명의 멤버' },
        { icon: MonitorSmartphoneIcon, feature: '1개의 사이트' },
        { icon: FilesIcon, feature: '무제한 페이지' },
        {
          icon: MousePointerClickIcon,
          feature: '500 페이지뷰/월',
          tooltipMessage: '배포된 사이트가 1개월간 총 500회의 페이지 조회를 지원합니다',
        },
        { icon: SearchIcon, feature: '일반 검색' },
      ],
    },
    {
      name: 'Lite',
      price: selectedPrice === 'yearly' ? '2,030' : '2,900',
      features: [
        { icon: UsersRoundIcon, feature: '3명의 멤버' },
        { icon: MonitorSmartphoneIcon, feature: '1개의 사이트' },
        { icon: FilesIcon, feature: '무제한 페이지' },
        {
          icon: MousePointerClickIcon,
          feature: '100,000 페이지뷰/월',
          tooltipMessage: '배포된 사이트가 1개월간 총 100,000회의 페이지 조회를 지원합니다',
        },
        { icon: SearchIcon, feature: '일반 검색' },
        { icon: PaintbrushIcon, feature: '브랜딩' },
        { icon: LinkIcon, feature: '커스텀 도메인' },
      ],
    },
    {
      name: 'Pro',
      price: selectedPrice === 'yearly' ? '13,300' : '19,000',
      features: [
        { icon: UsersRoundIcon, feature: '무제한 멤버' },
        { icon: MonitorSmartphoneIcon, feature: '무제한 사이트' },
        { icon: FilesIcon, feature: '무제한 페이지' },
        { icon: MousePointerClickIcon, feature: '무제한 페이지뷰' },
        { icon: SearchIcon, feature: '일반 + AI 검색' },
        { icon: PaintbrushIcon, feature: '브랜딩' },
        { icon: LinkIcon, feature: '커스텀 도메인' },
        { icon: UserCogIcon, feature: '멤버 권한 관리' },
        { icon: RefreshCwIcon, feature: '콘텐츠 최신화 (Beta)' },
      ],
    },
    {
      name: 'Enterprise',
      price: '문의',
      features: [
        { icon: CheckCircle2Icon, feature: 'Pro 플랜의 모든 기능' },
        { icon: WrenchIcon, feature: '커스텀 플랜' },
        { icon: FileSignatureIcon, feature: 'SLA 계약' },
        { icon: HeadphonesIcon, feature: '24/7 지원' },
        { icon: ClipboardListIcon, feature: '감사 로그' },
        { icon: SettingsIcon, feature: '맞춤형 기능 개발' },
        { icon: ContactIcon, feature: '전담 담당자 배정' },
        { icon: EllipsisIcon, feature: '그리고 무엇이든 요청하세요' },
      ],
    },
  ]);

  const darkSections = $derived([darkSection].filter((v) => !!v));
</script>

<Helmet
  description="개인용 문서부터 기업용 가이드까지 알맞은 플랜을 선택해보세요"
  image={{ src: 'https://cdn.rdbl.app/opengraph/cover.png', size: 'large' }}
  title="가격 안내"
  trailing="리더블"
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

<div class={css({ backgroundColor: 'neutral.10' })}>
  <div
    bind:this={darkSection}
    class={flex({
      position: 'relative',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'neutral.100',
      overflow: 'hidden',
      color: 'white',
      paddingTop: { base: '128px', lg: '168px' },
      paddingBottom: { base: '84px', lg: '130px' },
    })}
  >
    <h1
      class={css({
        marginBottom: { base: '10px', lg: '16px' },
        fontSize: { base: '24px', lg: '[45px]' },
        fontWeight: '[800]',
        textAlign: 'center',
      })}
    >
      가격 안내
    </h1>

    <p class={css({ marginBottom: '60px', textStyle: { base: '14m', lg: '22m' }, textAlign: 'center' })}>
      개인용 문서부터 기업용 가이드까지 알맞은 플랜을 선택해보세요
    </p>

    <div class={css({ position: 'relative' })}>
      <SegmentButtons
        defaultValue="yearly"
        items={[
          { label: '월 결제', value: 'monthly' },
          { label: '연 결제', value: 'yearly' },
        ]}
        onselect={(value) => (selectedPrice = value)}
        variant="white"
      />
      <span
        class={css({
          position: 'absolute',
          top: '-29px',
          right: '0',
          borderRadius: 'full',
          paddingX: '10px',
          paddingY: '4px',
          backgroundColor: '[#1EDFD3]',
          textStyle: '13sb',
          color: 'text.primary',
        })}
      >
        30% 할인
      </span>
    </div>
  </div>

  <div
    class={grid({
      columns: { base: 1, md: 2, lg: 3 },
      gap: { base: '16px', lg: '20px' },
      marginTop: { base: '-60px', lg: '-105px' },
      marginX: 'auto',
      marginBottom: '200px',
      paddingX: '20px',
      width: 'full',
      maxWidth: '1280px',
    })}
  >
    {#each plans as plan (plan.name)}
      <div
        class={flex({
          direction: 'column',
          borderWidth: '2px',
          borderColor: plan.name === 'Pro' ? '[#FFA16B]' : 'border.primary',
          borderRadius: '[20px]',
          padding: '24px',
          width: 'full',
          backgroundColor: 'white',
          boxShadow: 'emphasize',
          height: { base: '538px', md: '575px' },
          zIndex: '1',
        })}
      >
        <div
          class={flex({
            align: 'center',
            justify: 'space-between',
            marginBottom: { base: '6px', lg: '10px' },
            textStyle: { base: '14b', lg: '18b' },
            color: 'text.tertiary',
          })}
        >
          {plan.name}

          {#if plan.name === 'Pro'}
            <div
              class={css({
                borderRadius: '6px',
                paddingX: '12px',
                paddingY: '4px',
                textStyle: '14sb',
                color: 'white',
                backgroundColor: 'accent.60',
              })}
            >
              추천
            </div>
          {/if}
        </div>

        <p class={css({ textStyle: { base: '22eb', lg: '28eb' } })}>
          {plan.price}
          {#if ['Lite', 'Pro'].includes(plan.name)}
            <span class={css({ textStyle: { base: '13sb', lg: '16sb' } })}>원 / 월</span>
          {/if}
        </p>

        <HorizontalDivider style={css.raw({ marginY: '16px' })} />

        <div class={flex({ direction: 'column', gap: '12px', textStyle: { base: '13m', lg: '14m' } })}>
          {#each plan.features as feature (feature.feature)}
            <div class={flex({ align: 'center', gap: '6px', color: 'text.secondary' })}>
              <Icon icon={feature.icon} size={14} />
              <span>{feature.feature}</span>

              {#if feature?.tooltipMessage}
                <Tooltip message={feature.tooltipMessage} placement="top">
                  <Icon icon={CircleHelpIcon} size={12} />
                </Tooltip>
              {/if}
            </div>
          {/each}
        </div>

        {#if plan.name === 'Enterprise'}
          <Button
            style={css.raw({ marginTop: 'auto', width: 'full' })}
            href="/contact"
            size="lg"
            type="link"
            variant="secondary"
          >
            문의하기
          </Button>
        {:else}
          <Button
            style={css.raw({ marginTop: 'auto', width: 'full' })}
            glossy
            href={withUtm(env.PUBLIC_DASHBOARD_URL)}
            size="lg"
            type="link"
            variant={plan.name === 'Pro' ? 'primary' : 'secondary'}
          >
            시작하기
          </Button>
        {/if}
      </div>
    {/each}
  </div>
</div>
