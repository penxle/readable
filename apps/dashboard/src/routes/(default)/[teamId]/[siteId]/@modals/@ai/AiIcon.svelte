<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { token } from '@readable/styled-system/tokens';

  type Props = {
    variant?: 'gradient' | 'gray';
  };

  let { variant = 'gradient' }: Props = $props();

  let color = variant === 'gradient' ? token('colors.accent.50') : token('colors.neutral.50');
</script>

<svg
  class={css({
    flexShrink: 0,
  })}
  fill="none"
  height="21"
  viewBox="0 0 20 21"
  width="20"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M13.3333 15.5C13.7754 15.5 14.1993 15.6756 14.5118 15.9881C14.8244 16.3007 15 16.7246 15 17.1666C15 16.7246 15.1756 16.3007 15.4882 15.9881C15.8007 15.6756 16.2246 15.5 16.6667 15.5C16.2246 15.5 15.8007 15.3244 15.4882 15.0118C15.1756 14.6993 15 14.2753 15 13.8333C15 14.2753 14.8244 14.6993 14.5118 15.0118C14.1993 15.3244 13.7754 15.5 13.3333 15.5ZM13.3333 5.49998C13.7754 5.49998 14.1993 5.67557 14.5118 5.98813C14.8244 6.3007 15 6.72462 15 7.16665C15 6.72462 15.1756 6.3007 15.4882 5.98813C15.8007 5.67557 16.2246 5.49998 16.6667 5.49998C16.2246 5.49998 15.8007 5.32438 15.4882 5.01182C15.1756 4.69926 15 4.27534 15 3.83331C15 4.27534 14.8244 4.69926 14.5118 5.01182C14.1993 5.32438 13.7754 5.49998 13.3333 5.49998ZM7.5 15.5C7.5 14.1739 8.02678 12.9021 8.96447 11.9644C9.90215 11.0268 11.1739 10.5 12.5 10.5C11.1739 10.5 9.90215 9.9732 8.96447 9.03551C8.02678 8.09783 7.5 6.82606 7.5 5.49998C7.5 6.82606 6.97322 8.09783 6.03553 9.03551C5.09785 9.9732 3.82608 10.5 2.5 10.5C3.82608 10.5 5.09785 11.0268 6.03553 11.9644C6.97322 12.9021 7.5 14.1739 7.5 15.5Z"
    stroke="url(#paint0_linear_2114_1872)"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
  />
  <defs>
    <linearGradient
      id="paint0_linear_2114_1872"
      gradientUnits="userSpaceOnUse"
      x1="0.416667"
      x2="16.6667"
      y1="-1.16669"
      y2="17.1666"
    >
      <stop stop-color={color} />
      <stop offset="1" stop-color={color} stop-opacity={variant === 'gradient' ? '0.46' : undefined} />
    </linearGradient>
  </defs>
</svg>
