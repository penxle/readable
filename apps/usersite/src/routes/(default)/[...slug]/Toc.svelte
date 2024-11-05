<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { createAnchorId } from '@readable/ui/utils';
  import { onMount } from 'svelte';
  import { run } from 'svelte/legacy';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  type Props = {
    headings?: { level: number; text: string; scrollTop: number }[];
  };

  let { headings = [] }: Props = $props();

  let scrollMarginTop = 101; /* 헤더 높이 + 37px */
  let boundary = scrollMarginTop;
  let boundaryLock = false;

  let activeHeadingIndex = $state(0);
  let prevScrollY: number | null = null;
  const handleScroll = () => {
    if (prevScrollY) {
      const scrollDiff = window.scrollY - prevScrollY;
      if (scrollDiff < 0) {
        // 위로 스크롤
        if (!boundaryLock) {
          boundary += scrollDiff * 2;
          boundary = Math.max(boundary, scrollMarginTop);
        }

        // boundary 밑에 있는 가장 가까운 헤딩 찾기
        let newActiveIndex = headings.findIndex((heading) => heading.scrollTop >= window.scrollY + boundary);
        if (newActiveIndex === -1) {
          newActiveIndex = headings.length - 1;
        }
        if (newActiveIndex < activeHeadingIndex) {
          activeHeadingIndex = newActiveIndex;
        }
      } else if (scrollDiff > 0) {
        // 아래로 스크롤
        if (!boundaryLock) {
          boundary += scrollDiff * 2;
          boundary = Math.min(boundary, window.innerHeight / 1.5); // 아래부터 1/3 지점
        }

        // boundary 위에 있는 가장 가까운 헤딩 뒤에서부터 찾기
        let newActiveIndex = headings.findLastIndex((heading) => heading.scrollTop <= window.scrollY + boundary);
        if (newActiveIndex === -1) {
          newActiveIndex = 0;
        }
        if (newActiveIndex > activeHeadingIndex) {
          activeHeadingIndex = newActiveIndex;
        }
      }
    }

    prevScrollY = window.scrollY;
  };

  const handleClick = async (event: MouseEvent, item: (typeof headings)[number]) => {
    event.preventDefault();
    goto(`#${createAnchorId(item.text)}`, {
      noScroll: true,
    });
    boundary = scrollMarginTop;
    boundaryLock = true;
    await scrollToElementTop(item.scrollTop - scrollMarginTop);
    boundaryLock = false;

    if (item.scrollTop > window.scrollY + scrollMarginTop) {
      // NOTE: boundary가 목표한 heading까지 닿지 않은 경우
      boundary = item.scrollTop - window.scrollY;
      activeHeadingIndex = headings.indexOf(item);
    }
  };

  const scrollToElementTop = (top: number) => {
    const maxScrollY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;

    // HACK: 어째선지 0.5px 차이가 난다
    const scrollY = Math.floor(window.scrollY);

    // NOTE: 같은 위치거나 이미 스크롤 끝에 있음
    if (top === scrollY || (top > maxScrollY && scrollY === maxScrollY)) {
      return Promise.resolve();
    }

    setTimeout(() => {
      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    });

    return new Promise((resolve) => {
      const scrollendHandler = () => {
        window.removeEventListener('scrollend', scrollendHandler);
        resolve(void 0);
      };
      window.addEventListener('scrollend', scrollendHandler);
    });
  };

  const defaultIndent = 12;
  let indents: number[] = $state([]);
  run(() => {
    if (headings.length > 1) {
      let currentIndent = defaultIndent;
      let prevLevel = headings[0]?.level;

      indents = [];
      for (const item of headings) {
        const indent = Math.max(defaultIndent, currentIndent + (item.level - prevLevel) * 20);
        indents.push(indent);
        currentIndent = indent;
        prevLevel = item.level;
      }

      indents = indents;
    }
  });

  onMount(() => {
    // FIXME: 마운트 시점에 처음 들어오는 scrollTop 값이 이상해서 임시로 setTimeout 사용
    setTimeout(() => {
      const anchor = headings.find((heading) => `#${createAnchorId(heading.text)}` === $page.url.hash);
      if (anchor) {
        boundary = anchor.scrollTop - window.scrollY;
        window.scrollTo({
          top: anchor.scrollTop - scrollMarginTop,
          behavior: 'auto',
        });
        activeHeadingIndex = headings.indexOf(anchor);
      }
    }, 0);
  });
</script>

<svelte:window onscroll={handleScroll} />

<div
  class={flex({
    position: 'sticky',
    top: '64px',
    flexDirection: 'column',
    gap: '8px',
    width: '220px',
    paddingTop: '60px',
    paddingX: '20px',
    paddingBottom: '120px',
  })}
  hidden={headings.length <= 1}
>
  <nav role="doc-toc">
    <ul
      class={flex({
        direction: 'column',
        listStyle: 'none',
        gap: '6px',
        borderLeftWidth: '1px',
        borderColor: 'neutral.30',
      })}
    >
      {#each headings as item, index (index)}
        <li>
          <a
            style:padding-left={`${indents[index]}px`}
            class={css(
              {
                marginLeft: '-1px',
                display: 'block',
                paddingY: '1px',
                textStyle: '14r',
                color: 'text.secondary',
                _hover: { textDecoration: 'underline' },
              },
              activeHeadingIndex === index && {
                color: 'text.primary',
                textStyle: '14b',
                borderLeftWidth: '1px',
                borderColor: 'text.primary',
              },
            )}
            aria-current={$page.url.hash === `#${createAnchorId(item.text)}` ? 'location' : undefined}
            href={`#${createAnchorId(item.text)}`}
            onclick={(e) => handleClick(e, item)}
          >
            {item.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</div>
