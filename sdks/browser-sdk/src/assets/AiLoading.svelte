<svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
  <circle
    class="circle1"
    cx="2"
    cy="13"
    fill="var(--widget-theme-color)"
    fill-opacity="0.12"
    r="2"
    transform="rotate(180 2 13)"
  />
  <circle
    class="circle2"
    cx="10"
    cy="13"
    fill="var(--widget-theme-color)"
    fill-opacity="0.46"
    r="2"
    transform="rotate(180 10 13)"
  />
  <circle
    class="circle3"
    cx="18"
    cy="13"
    fill="var(--widget-theme-color)"
    fill-opacity="0.72"
    r="2"
    transform="rotate(180 18 13)"
  />
</svg>

<style>
  @keyframes bounce {
    0%,
    100% {
      cy: 13;
      opacity: 0.5;
    }
    50% {
      cy: 8;
      opacity: 1;
    }
  }

  .circle1,
  .circle2,
  .circle3 {
    animation: bounce 600ms ease-in-out infinite;
  }

  .circle1 {
    animation-delay: 0ms;
  }

  .circle2 {
    animation-delay: 100ms;
  }

  .circle3 {
    animation-delay: 200ms;
  }
</style>
