<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import SvelteMarkdown from 'svelte-markdown';
  import type { SystemStyleObject } from '@readable/styled-system/types';

  let { source, style }: { source: string; style?: SystemStyleObject } = $props();

  // NOTE: p, em, strong, ul, ol, li 이외에는 AI 출력에서 발견하지 못함
  const markdownStyles = css({
    '& p:not(:last-child)': {
      marginBottom: '16px',
      lineHeight: '[1.6]',
    },
    '& em': {
      fontStyle: 'italic',
    },
    '& strong': {
      fontWeight: 'bold',
    },
    '& a': {
      // TODO: 본문 인라인 링크 스타일 적용
      textDecoration: 'underline',
    },
    '& del': {
      textDecoration: 'line-through',
    },
    '& code': {
      // TODO: 본문 인라인 코드 스타일 적용
      fontFamily: 'mono',
      backgroundColor: 'neutral.30/70',
      paddingX: '4px',
      paddingY: '2px',
      borderRadius: '4px',
      fontSize: '[0.9em]',
    },
    '& ul, & ol': {
      marginBottom: '16px',
      paddingLeft: '24px',
    },
    '& ul': {
      listStyleType: 'disc',
    },
    '& ol': {
      listStyleType: 'decimal',
    },
    '& li': {
      marginBottom: '8px',
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontWeight: 'bold',
      marginTop: '24px',
      marginBottom: '16px',
      lineHeight: '[1.25]',
    },
    '& h1': { fontSize: '[2em]' },
    '& h2': { fontSize: '[1.5em]' },
    '& h3': { fontSize: '[1.25em]' },
    '& h4': { fontSize: '[1em]' },
    '& h5': { fontSize: '[0.875em]' },
    '& h6': { fontSize: '[0.85em]' },
  });
</script>

<p class={cx(markdownStyles, css(style))}>
  <SvelteMarkdown {source} />
</p>
