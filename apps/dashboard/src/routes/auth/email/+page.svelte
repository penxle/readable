<script lang="ts">
  import mixpanel from 'mixpanel-browser';
  import { onMount } from 'svelte';
  import { linear } from 'svelte/easing';
  import { tweened } from 'svelte/motion';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { graphql } from '$graphql';
  import { accessToken } from '$lib/graphql';

  const authorizeEmail = graphql(`
    mutation AuthEmailPage_AuthorizeEmail_Mutation($input: AuthorizeEmailInput!) {
      authorizeEmail(input: $input) {
        accessToken
        isNewUser
      }
    }
  `);

  onMount(async () => {
    const resp = await authorizeEmail({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      code: $page.url.searchParams.get('code')!,
    });
    $accessToken = resp.accessToken;

    mixpanel.track('user:login:success', {
      provider: 'EMAIL',
      isNewUser: resp.isNewUser,
    });

    await goto('/', {
      replaceState: true,
    });
  });

  /**
   * Logo animation
   */
  let visible = true;
  let duration = 250;
  const opacity = tweened(1, {
    duration,
    easing: linear,
  });

  onMount(() => {
    const interval = setInterval(() => {
      opacity.set(visible ? 0.75 : 1);
      visible = !visible;
    }, duration);

    return () => clearInterval(interval);
  });
</script>

<svg style:opacity={$opacity} fill="none" height="81" viewBox="0 0 80 81" width="80" xmlns="http://www.w3.org/2000/svg">
  <rect fill="url(#paint0_linear_1320_8674)" height="80" rx="12" width="80" y="0.5" />
  <path d="M55.1963 16.9192V53.0066L26.2007 64.0808V27.9935L55.1963 16.9192Z" fill="white" />
  <defs>
    <linearGradient
      id="paint0_linear_1320_8674"
      gradientUnits="userSpaceOnUse"
      x1="11.7031"
      x2="68.821"
      y1="0.499999"
      y2="83.2948"
    >
      <stop stop-color="#FF7728" />
      <stop offset="1" stop-color="#FF5E00" />
    </linearGradient>
  </defs>
</svg>
