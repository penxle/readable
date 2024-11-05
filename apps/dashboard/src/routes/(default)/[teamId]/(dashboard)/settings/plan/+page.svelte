<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, Helmet, Icon, SegmentButtons, Tooltip } from '@readable/ui/components';
  import mixpanel from 'mixpanel-browser';
  import { PlanId } from '@/const';
  import CheckIcon from '~icons/lucide/check';
  import InfoIcon from '~icons/lucide/info';
  import { LitePlan, ProPlan } from '$assets/plan';
  import { env } from '$env/dynamic/public';
  import { graphql } from '$graphql';
  import { isPlanUpgradeModalOpen, selectedPlan, selectedPlanCycle } from '$lib/svelte/stores/ui';

  const query = graphql(`
    query TeamSettingsPlanPage_Query($teamId: ID!) {
      team(teamId: $teamId) {
        id
        name

        plan {
          id

          plan {
            id
            name
            order
          }
        }
      }
    }
  `);

  const onSelect = (value: string) => {
    selectedPlanCycle.set(value as 'MONTHLY' | 'YEARLY');
  };

  const usages = [
    {
      title: '멤버',
      starter: '1명',
      lite: '3명',
      pro: '무제한',
      enterprise: '무제한',
    },
    {
      title: '사이트',
      starter: '1개',
      lite: '1개',
      pro: '무제한',
      enterprise: '무제한',
    },
    {
      title: '페이지',
      starter: '무제한',
      lite: '무제한',
      pro: '무제한',
      enterprise: '무제한',
    },
    {
      title: '페이지뷰',
      starter: '500회',
      lite: '100,000회',
      pro: '무제한',
      enterprise: '무제한',
    },
    {
      title: '검색',
      starter: '일반',
      lite: '일반',
      pro: '일반 + AI',
      enterprise: '일반 + AI',
    },
  ];

  const premiums = [
    {
      title: '브랜딩',
      starter: '',
      lite: CheckIcon,
      pro: CheckIcon,
      enterprise: CheckIcon,
    },
    {
      title: '커스텀 도메인',
      starter: '',
      lite: CheckIcon,
      pro: CheckIcon,
      enterprise: CheckIcon,
    },
    {
      title: '멤버 권한 관리',
      starter: '',
      lite: '',
      pro: CheckIcon,
      enterprise: CheckIcon,
    },
    {
      title: '콘텐츠 최신화(예정)',
      starter: '',
      lite: '',
      pro: '무제한',
      enterprise: '무제한',
    },
    {
      title: '커스텀 플랜',
      starter: '',
      lite: '',
      pro: '',
      enterprise: CheckIcon,
    },
    {
      title: '24/7 지원',
      starter: '',
      lite: '',
      pro: '',
      enterprise: CheckIcon,
    },
    {
      title: '감사 로그',
      starter: '',
      lite: '',
      pro: '',
      enterprise: CheckIcon,
    },
    {
      title: '맞춤형 기능 개발',
      starter: '',
      lite: '',
      pro: '',
      enterprise: CheckIcon,
    },
    {
      title: '전담 담당자 배정',
      starter: '',
      lite: '',
      pro: '',
      enterprise: CheckIcon,
    },
  ];

  const addOns = $derived([
    {
      title: '화이트 라벨링',
      starter: '',
      lite: '',
      pro: `${$selectedPlanCycle === 'YEARLY' ? '15,400' : '22,000'}원/사이트/월`,
      enterprise: CheckIcon,
    },
  ]);
</script>

<Helmet title="플랜" trailing={$query.team.name} />

<h1 class={css({ marginBottom: '20px', textStyle: '28b' })}>플랜</h1>

<div class={flex({ flexDirection: 'column', gap: '8px', marginRight: '-160px' })}>
  <div
    class={css({
      borderWidth: '1px',
      borderColor: 'border.primary',
      borderRadius: '10px',
      paddingTop: '54px',
      paddingX: '32px',
      paddingBottom: '32px',
      backgroundColor: 'surface.primary',
    })}
  >
    <table class={css({ width: 'full', borderSpacing: '0' })}>
      <thead>
        <tr>
          <th class={css({ width: '128px' })}></th>
          <th></th>
          <th>
            <div class={css({ position: 'relative', marginBottom: '10px' })}>
              <SegmentButtons
                defaultValue="YEARLY"
                items={[
                  { label: '월 결제', value: 'MONTHLY' },
                  { label: '연 결제', value: 'YEARLY' },
                ]}
                onselect={onSelect}
                size="sm"
              />
              <div
                class={css({
                  position: 'absolute',
                  top: '-26px',
                  right: '0',
                  borderRadius: 'full',
                  paddingX: '8px',
                  paddingY: '3px',
                  textStyle: '11sb',
                  color: 'white',
                  backgroundColor: 'neutral.80',
                })}
              >
                30% 할인
              </div>
            </div>
          </th>
          <th></th>
        </tr>
        <tr class={css({ '& > th': { paddingX: '12px', paddingY: '20px', textAlign: 'left' } })}>
          <th></th>
          <th class={css({ width: '160px' })}>
            <p class={css({ marginBottom: '4px', textStyle: '13m' })}>Starter</p>
            <span class={css({ textStyle: '20b' })}>무료</span>
            <!-- TODO: 다운그레이드 툴팁 문구 수정 -->
            <Tooltip enabled={$query.team.plan.plan.id !== PlanId.STARTER} message="플랜 다운그레이드는 문의해주세요">
              <Button
                style={flex.raw({ align: 'center', gap: '6px', marginTop: '40px', width: 'full' })}
                disabled
                size="sm"
                variant="secondary"
              >
                {#if $query.team.plan.plan.id === PlanId.STARTER}
                  <span>현재 플랜</span>
                {:else}
                  <span>다운그레이드</span>
                  <Icon icon={InfoIcon} />
                {/if}
              </Button>
            </Tooltip>
          </th>
          <th class={css({ width: '160px' })}>
            <p class={css({ marginBottom: '4px', textStyle: '13m' })}>Lite</p>
            <span class={css({ textStyle: '20b' })}>
              {($selectedPlanCycle === 'YEARLY' ? (LitePlan.price / 10) * 7 : LitePlan.price).toLocaleString()}
            </span>
            <span class={css({ textStyle: '13r' })}>원 / 월</span>
            {#if $query.team.plan.plan.order >= 2}
              <!-- TODO: 다운그레이드 툴팁 문구 수정 -->
              <Tooltip enabled={$query.team.plan.plan.order > 2} message="플랜 다운그레이드는 문의해주세요">
                <Button
                  style={flex.raw({ align: 'center', gap: '6px', marginTop: '40px', width: 'full' })}
                  disabled
                  size="sm"
                  variant="secondary"
                >
                  {#if $query.team.plan.plan.id === PlanId.LITE}
                    <span>현재 플랜</span>
                  {:else if $query.team.plan.plan.order > 2}
                    <span>다운그레이드</span>
                    <Icon icon={InfoIcon} />
                  {/if}
                </Button>
              </Tooltip>
            {:else}
              <Button
                style={css.raw({ marginTop: '40px', width: 'full' })}
                onclick={() => {
                  mixpanel.track('plan:upgrade:show', { via: 'plan' });
                  $isPlanUpgradeModalOpen = true;
                  $selectedPlan = LitePlan;
                }}
                size="sm"
                variant="secondary"
              >
                업그레이드
              </Button>
            {/if}
          </th>
          <th class={css({ borderTopRadius: '10px', backgroundColor: 'neutral.10', width: '160px' })}>
            <p class={flex({ align: 'center', justify: 'space-between', marginBottom: '4px', textStyle: '13m' })}>
              <span>Pro</span>
              <span
                class={css({
                  borderRadius: '4px',
                  paddingX: '6px',
                  paddingY: '2px',
                  textStyle: '11b',
                  color: 'text.accent',
                  backgroundColor: 'accent.10',
                })}
              >
                추천
              </span>
            </p>
            <span class={css({ textStyle: '20b' })}>
              {($selectedPlanCycle === 'YEARLY' ? (ProPlan.price / 10) * 7 : ProPlan.price).toLocaleString()}
            </span>
            <span class={css({ textStyle: '13r' })}>원 / 월</span>
            <Button
              style={css.raw({ marginTop: '40px', width: 'full' })}
              disabled={$query.team.plan.plan.id === PlanId.PRO}
              glossy
              onclick={() => {
                if ($query.team.plan.plan.id !== PlanId.PRO) {
                  mixpanel.track('plan:upgrade:show', { via: 'plan' });
                  $isPlanUpgradeModalOpen = true;
                  $selectedPlan = ProPlan;
                }
              }}
              size="sm"
              variant="primary"
            >
              {$query.team.plan.plan.id === PlanId.PRO ? '현재 플랜' : '업그레이드'}
            </Button>
          </th>
          <th class={css({ width: '160px' })}>
            <p class={css({ marginBottom: '4px', textStyle: '13m' })}>Enterprise</p>
            <span class={css({ textStyle: '20b' })}>문의</span>
            <Button
              style={css.raw({ marginTop: '40px', width: 'full' })}
              href={`${env.PUBLIC_WEBSITE_URL}/contact`}
              rel="noopener noreferrer"
              size="sm"
              target="_blank"
              type="link"
              variant="secondary"
            >
              문의
            </Button>
          </th>
        </tr>
      </thead>
      <tbody
        class={css({
          '& > tr > td': {
            borderColor: 'border.primary',
            paddingX: '12px',
            paddingY: '10px',
            color: 'text.secondary',
          },
        })}
      >
        <tr class={css({ '& > td': { borderBottomWidth: '1px' } })}>
          <td class={css({ textStyle: '13sb' })}>Usage</td>
          <td></td>
          <td></td>
          <td class={css({ backgroundColor: 'neutral.10' })}></td>
          <td></td>
        </tr>
        {#each usages as usage (usage.title)}
          <tr class={css({ '& > td': { borderBottomWidth: '1px', textStyle: '13r' } })}>
            <td class={flex({ align: 'center', gap: '4px' })}>
              {usage.title}
              {#if usage.title === '페이지뷰'}
                <Tooltip message="배포된 사이트의 1개월간 총 페이지 조회 수로 계산합니다">
                  <Icon icon={InfoIcon} size={14} />
                </Tooltip>
              {/if}
            </td>
            <td>{usage.starter}</td>
            <td>{usage.lite}</td>
            <td class={css({ backgroundColor: 'neutral.10' })}>{usage.pro}</td>
            <td>{usage.enterprise}</td>
          </tr>
        {/each}
        <tr>
          <td>&nbsp;</td>
          <td></td>
          <td></td>
          <td class={css({ backgroundColor: 'neutral.10' })}></td>
          <td></td>
        </tr>
        <tr class={css({ '& > td': { borderBottomWidth: '1px' } })}>
          <td class={css({ textStyle: '13sb' })}>Premium</td>
          <td></td>
          <td></td>
          <td class={css({ backgroundColor: 'neutral.10' })}></td>
          <td></td>
        </tr>
        {#each premiums as premium (premium.title)}
          <tr class={css({ '& > td': { borderBottomWidth: '1px', textStyle: '13r' } })}>
            <td>{premium.title}</td>
            <td>{premium.starter}</td>
            <td>
              {#if typeof premium.lite === 'string'}
                {premium.lite}
              {:else}
                <Icon icon={premium.lite} size={14} />
              {/if}
            </td>
            <td class={css({ backgroundColor: 'neutral.10' })}>
              {#if typeof premium.pro === 'string'}
                {premium.pro}
              {:else}
                <Icon icon={premium.pro} size={14} />
              {/if}
            </td>
            <td>
              {#if typeof premium.enterprise === 'string'}
                {premium.enterprise}
              {:else}
                <Icon icon={premium.enterprise} size={14} />
              {/if}
            </td>
          </tr>
        {/each}
        <tr>
          <td>&nbsp;</td>
          <td></td>
          <td></td>
          <td class={css({ backgroundColor: 'neutral.10' })}></td>
          <td></td>
        </tr>
        <tr class={css({ '& > td': { borderBottomWidth: '1px' } })}>
          <td class={css({ textStyle: '13sb' })}>Add-on</td>
          <td></td>
          <td></td>
          <td class={css({ backgroundColor: 'neutral.10' })}></td>
          <td></td>
        </tr>
        {#each addOns as addOn (addOn.title)}
          <tr class={css({ '& > td': { borderBottomWidth: '1px', textStyle: '13r' } })}>
            <td>{addOn.title}</td>
            <td>{addOn.starter}</td>
            <td>{addOn.lite}</td>
            <td class={css({ backgroundColor: 'neutral.10' })}>
              {#if typeof addOn.pro === 'string'}
                {addOn.pro}
              {:else}
                <Icon icon={addOn.pro} size={14} />
              {/if}
            </td>
            <td>
              {#if typeof addOn.enterprise === 'string'}
                {addOn.enterprise}
              {:else}
                <Icon icon={addOn.enterprise} size={14} />
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
