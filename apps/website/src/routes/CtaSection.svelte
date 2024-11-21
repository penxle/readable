<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, Icon } from '@readable/ui/components';
  import ChevronRightIcon from '~icons/lucide/chevron-right';
  import { env } from '$env/dynamic/public';
  import { withUtm } from '$lib/utm';
</script>

<div
  class={css({
    paddingTop: '54px',
    paddingBottom: '29px',
    lg: {
      paddingY: '120px',
    },
    background: '[linear-gradient(110deg, rgba(255, 122, 45, 1.00) 4.65%, rgba(255, 94, 0, 1.00) 92.57%)]',
  })}
>
  <div
    class={flex({
      align: 'center',
      justify: 'space-between',
      gap: '40px',
      marginX: 'auto',
      paddingX: '20px',
      maxWidth: '960px',
      lgDown: { flexDirection: 'column' },
    })}
  >
    <div class={css({ color: 'white' })}>
      <h2
        class={css({
          marginBottom: { base: '10px', lg: '16px' },
          fontSize: { base: '24px', lg: '[45px]' },
          fontWeight: '[800]',
          lgDown: { textAlign: 'center' },
        })}
      >
        아직 고민하고 계신가요?
      </h2>

      <p class={css({ textStyle: { base: '14m', lg: '20m' }, lgDown: { textAlign: 'center' } })}>
        카드 등록 없이 지금 바로 시작해보세요.
        <br />
        기존 문서가 있으신가요?
        <!-- prettier-ignore -->
        <span>
          <a
            class={css({ textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: 'white/40' })}
            href="/preview"
          >
            이사 서비스를 무료로 이용</a>해보세요.
        </span>
      </p>
    </div>

    <div class={flex({ align: 'center', gap: { base: '16px', lg: '32px' }, lgDown: { flexDirection: 'column' } })}>
      <Button
        href={withUtm(env.PUBLIC_DASHBOARD_URL)}
        rel="noopener noreferrer"
        size="lg"
        target="_blank"
        type="link"
        variant="secondary"
      >
        30초만에 시작하기
      </Button>

      <a
        class={flex({
          gap: '6px',
          alignItems: 'center',
          paddingLeft: '8px',
          textStyle: { base: '15sb', lg: '16sb' },
          color: 'white',
        })}
        href="https://docs.rdbl.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        예시 사이트 보기
        <Icon icon={ChevronRightIcon} size={20} />
      </a>
    </div>
  </div>
</div>
