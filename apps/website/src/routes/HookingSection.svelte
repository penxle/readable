<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Icon } from '@readable/ui/components';
  import AccessibilityIcon from '~icons/lucide/accessibility';
  import BarChartIcon from '~icons/lucide/bar-chart';
  import BotIcon from '~icons/lucide/bot';
  import FlaskConicalIcon from '~icons/lucide/flask-conical';
  import GitBranchIcon from '~icons/lucide/git-branch';
  import GlobeIcon from '~icons/lucide/globe';
  import LayoutIcon from '~icons/lucide/layout';
  import RefreshCwIcon from '~icons/lucide/refresh-cw';
  import SearchIcon from '~icons/lucide/search';
  import UsersIcon from '~icons/lucide/users';

  const cards = [
    {
      icon: LayoutIcon,
      title: '반응형 디자인',
      description: '모든 디바이스에 최적화된 사용자 경험',
    },
    {
      icon: FlaskConicalIcon,
      title: 'SEO',
      description: '검색 엔진 최적화',
    },
    {
      icon: SearchIcon,
      title: '키워드 검색',
      description: '아주 빠른 실시간 검색',
    },
    {
      icon: BotIcon,
      title: 'AI 검색',
      description: 'RAG 기반 자연어 검색',
    },
    {
      icon: GitBranchIcon,
      title: '버전관리',
      description: '콘텐츠 변경 이력 추적',
    },
    {
      icon: UsersIcon,
      title: '동시편집',
      description: '막힘 없는 실시간 협업',
    },
    {
      icon: AccessibilityIcon,
      title: '접근성',
      description: '모두를 위한 포용적 디자인',
    },
    {
      icon: GlobeIcon,
      title: '다국어',
      description: '글로벌 사용자용 다국어 지원',
    },
    {
      icon: BarChartIcon,
      title: '접속자 통계 및 인사이트',
      description: '사용자 데이터 수집 및 행동 분석',
    },
    {
      icon: RefreshCwIcon,
      title: '콘텐츠 최신화',
      description: '지속적인 업데이트로 신뢰성 향상',
    },
  ];

  const topCards = cards.slice(0, Math.ceil(cards.length / 2));
  const bottomCards = cards.slice(Math.ceil(cards.length / 2));
</script>

<div
  class={flex({
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingY: '80px',
    smOnly: {
      paddingTop: '54px',
      paddingBottom: '40px',
    },
  })}
>
  <h1
    class={css({
      fontSize: '[36px]',
      fontWeight: '[800]',
      lineHeight: '[140%]',
      letterSpacing: '-0.144px',
      textAlign: 'center',
      mdDown: {
        fontSize: '28px',
      },
    })}
  >
    내용에만 집중하세요
    <br />
    나머지는 리더블이 해드려요
  </h1>
  <p
    class={css({
      marginTop: '20px',
      color: 'text.secondary',
      fontSize: '[18px]',
      fontWeight: '[500]',
      lineHeight: '[144%]',
      letterSpacing: '-0.088px',
      textAlign: 'center',
      mdDown: {
        fontSize: '16px',
      },
    })}
  >
    리더블은 도움센터 구축의 복잡성을 제거했습니다.
    <br />
    더 이상 기술적인 세부사항에 시간을 소모하지 마세요.
  </p>

  <div
    class={flex({
      position: 'relative',
      marginTop: '102px',
      width: 'full',
      maxWidth: '960px',
      marginX: 'auto',
      flexDirection: 'column',
      gap: '16px',
      overflow: 'hidden',
      mdDown: {
        marginTop: '64px',
      },
    })}
  >
    <div
      class={css({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '80px',
        height: 'full',
        background: '[linear-gradient(90deg, #FFF 0%, rgba(255, 255, 255, 0.00) 103.69%)]',
        zIndex: '10',
      })}
    ></div>
    <div
      class={css({
        position: 'absolute',
        top: '0',
        right: '0',
        width: '80px',
        height: 'full',
        background: '[linear-gradient(90deg, rgba(255, 255, 255, 0.00) 0%, #FFF 103.69%)]',
        zIndex: '10',
      })}
    ></div>

    <!-- 윗줄 카드 (왼쪽으로 이동) -->
    <div
      class={css({
        display: 'flex',
        gap: '16px',
        animation: 'scrollCardsLeft 20s linear infinite',
        lg: {
          animation: 'scrollCardsLeftLg 20s linear infinite',
        },
        lgDown: {
          gap: '14px',
        },
      })}
    >
      {#each [...topCards, ...topCards, ...topCards] as card, index (index)}
        <div
          class={flex({
            flexShrink: 0,
            width: '296px',
            height: '138px',
            borderWidth: '1px',
            borderColor: 'border.primary',
            borderRadius: '8px',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '20px',
            backgroundColor: 'white',
            color: 'text.tertiary',
            lgDown: {
              width: '220px',
              height: '105px',
              padding: '16px',
            },
          })}
        >
          <Icon style={css.raw({ lgDown: { size: '16px' } })} icon={card.icon} size={24} />
          <p
            class={css({
              marginTop: '10px',
              fontSize: '[18px]',
              fontWeight: '[700]',
              color: 'text.primary',
              lgDown: {
                fontSize: '14px',
              },
            })}
          >
            {card.title}
          </p>
          <p
            class={css({
              marginTop: '4px',
              fontSize: '[14px]',
              fontWeight: '[500]',
              lgDown: {
                marginTop: '2px',
                fontSize: '12px',
              },
            })}
          >
            {card.description}
          </p>
        </div>
      {/each}
    </div>

    <!-- 아랫줄 카드 (오른쪽으로 이동) -->
    <div
      class={css({
        display: 'flex',
        gap: '16px',
        animation: 'scrollCardsRight 20s linear infinite',
        lg: {
          animation: 'scrollCardsRightLg 20s linear infinite',
        },
        lgDown: {
          gap: '14px',
        },
      })}
    >
      {#each [...bottomCards, ...bottomCards, ...bottomCards] as card, index (index)}
        <div
          class={flex({
            flexShrink: 0,
            width: '296px',
            height: '138px',
            borderWidth: '1px',
            borderColor: 'border.primary',
            borderRadius: '8px',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '20px',
            backgroundColor: 'white',
            color: 'text.tertiary',
            lgDown: {
              width: '220px',
              height: '105px',
              padding: '16px',
            },
          })}
        >
          <Icon style={css.raw({ lgDown: { size: '16px' } })} icon={card.icon} size={24} />
          <p
            class={css({
              marginTop: '10px',
              fontSize: '[18px]',
              fontWeight: '[700]',
              color: 'text.primary',
              lgDown: {
                fontSize: '14px',
              },
            })}
          >
            {card.title}
          </p>
          <p
            class={css({
              marginTop: '4px',
              fontSize: '[14px]',
              fontWeight: '[500]',
              lgDown: {
                marginTop: '2px',
                fontSize: '12px',
              },
            })}
          >
            {card.description}
          </p>
        </div>
      {/each}
    </div>
  </div>
</div>
