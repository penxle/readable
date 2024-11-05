<script lang="ts">
  import { css, cx } from '@readable/styled-system/css';
  import { Icon } from '@readable/ui/components';
  import UploadIcon from '~icons/lucide/upload';
  import { uploadBlobAsImage } from '$lib/utils/blob.svelte';
  import LoadableImg from './LoadableImg.svelte';

  type Props = {
    id: string;
    editable?: boolean;
    onchange?: (id: string) => void;
  };

  let { id = $bindable(), editable = true, onchange }: Props = $props();
</script>

<svelte:element
  this={editable ? 'label' : 'div'}
  class={cx(
    css(
      {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        size: '64px',
        borderWidth: '1px',
        borderColor: 'border.image',
        borderRadius: 'full',
        overflow: 'hidden',
      },
      editable && {
        cursor: 'pointer',
      },
    ),
    'group',
  )}
>
  {#if id}
    <LoadableImg {id} style={css.raw({ size: 'full' })} alt="아바타" size={64} />
  {/if}

  {#if editable}
    <div
      class={css({
        display: 'none',
        _groupHover: {
          position: 'absolute',
          display: 'flex',
          size: 'full',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'neutral.100/16',
          color: 'neutral.0',
          borderRadius: 'full',
          transition: '[opacity 0.2s]',
        },
        _groupActive: {
          backgroundColor: 'neutral.100/24',
        },
      })}
    >
      <Icon icon={UploadIcon} size={28} />
    </div>

    <input
      accept="image/*"
      hidden
      onchange={async (event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (!file) {
          return;
        }

        const resp = await uploadBlobAsImage(file, {
          ensureAlpha: true,
          resize: { width: 512, height: 512, fit: 'contain', background: '#00000000' },
          format: 'png',
        });

        id = resp.id;
        onchange?.(resp.id);
      }}
      type="file"
    />
  {/if}
</svelte:element>
