<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { wrap } from '@readable/styled-system/patterns';
  import { Button, Icon } from '@readable/ui/components';
  import BookOpenTextIcon from '~icons/lucide/book-open-text';
  import MessageCircleIcon from '~icons/lucide/message-circle';

  type Props = {
    site: {
      url: string;
      name: string;
      widget: {
        outLink?: string | null;
      };
    };
  };

  const { site }: Props = $props();
</script>

<div class={wrap({ gap: '8px', maxWidth: 'full' })}>
  <Button
    style={css.raw({
      maxWidth: 'full',
      flexShrink: 0,
      gap: '6px',
      paddingLeft: '16px',
      pointerEvents: 'auto',
    })}
    href={site.url}
    rel="noopener noreferrer"
    size="md"
    target="_blank"
    type="link"
    variant="secondary"
  >
    <Icon icon={BookOpenTextIcon} size={18} />
    <span class={css({ truncate: true })}>{site.name}</span>
  </Button>

  {#if site.widget.outLink}
    <Button
      style={css.raw({ gap: '6px', paddingLeft: '16px', pointerEvents: 'auto' })}
      href={site.widget.outLink}
      rel="noopener noreferrer"
      size="md"
      target="_blank"
      type="link"
      variant="secondary"
    >
      <Icon icon={MessageCircleIcon} size={18} />
      <span>1:1 문의</span>
    </Button>
  {/if}
</div>
