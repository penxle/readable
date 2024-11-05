<script lang="ts">
  import '../app.css';

  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { onMount } from 'svelte';
  import FullLogo from '$assets/logos/full.svg?component';
  import { persistUtm } from '$lib/utm';

  let { children } = $props();

  onMount(() => {
    persistUtm();
  });
</script>

<div class={flex({ direction: 'column', grow: '1', minHeight: 'screen', wordBreak: 'keep-all' })}>
  {@render children()}

  <footer
    class={flex({
      marginX: 'auto',
      width: 'full',
      maxWidth: '1280px',
      direction: 'column',
      gap: '40px',
      paddingX: { base: '24px', lg: '32px' },
      paddingY: '48px',
      backgroundColor: 'neutral.0',
    })}
  >
    <div class={flex({ align: 'center', justify: 'space-between' })}>
      <FullLogo class={css({ height: { base: '18px', lg: '22px' } })} />
    </div>

    <div
      class={flex({ textStyle: { base: '12r', lg: '14r' }, color: 'text.tertiary', direction: 'column', gap: '4px' })}
    >
      <p>주식회사 펜슬컴퍼니 | 대표 배준현 | 서울특별시 강남구 강남대로100길 14, 6층</p>

      <p>
        사업자등록번호 610-88-03078 | <a
          href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=6108803078"
          rel="noopener noreferrer"
          target="_blank"
        >
          통신판매업신고 2023-서울강남-4541
        </a>
      </p>

      <p>02-565-7695 | hello@penxle.io</p>
    </div>
  </footer>
</div>
