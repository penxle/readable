<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import InfoIcon from '~icons/lucide/info';
  import { setFormField } from '../forms';
  import FormValidationMessage from './FormValidationMessage.svelte';
  import Icon from './Icon.svelte';
  import Tooltip from './Tooltip.svelte';
  import type { SystemStyleObject } from '@readable/styled-system/types';
  import type { Snippet } from 'svelte';

  type Props = {
    style?: SystemStyleObject;
    name: string;
    label?: string;
    description?: string;
    noMessage?: boolean;
    labelSuffix?: Snippet;
    children?: Snippet;
    rightText?: Snippet;
  };

  let { style, name, label, description, noMessage = false, labelSuffix, children, rightText }: Props = $props();

  setFormField({
    name,
  });
</script>

<fieldset class={css({ display: 'flex', flexDirection: 'column' }, style)}>
  {#if label}
    <label
      class={flex({
        align: 'center',
        marginBottom: '8px',
        textStyle: '14sb',
        color: { base: 'gray.700', _dark: 'gray.300' },
      })}
      for={name}
    >
      <span>
        {label}
      </span>
      {#if description}
        <Tooltip message={description} placement="right">
          <Icon style={css.raw({ color: 'neutral.50', marginLeft: '4px' })} icon={InfoIcon} size={14} />
        </Tooltip>
      {/if}
      {@render labelSuffix?.()}
    </label>
  {/if}

  {@render children?.()}

  {#if !noMessage}
    <div
      class={flex({
        align: 'center',
        justify: 'space-between',
        gap: '4px',
        height: '17px',
        textStyle: '12r',
        marginTop: '4px',
        color: { base: 'red.600', _dark: 'red.500' },
      })}
    >
      <div class={flex({ align: 'center', gap: '4px' })}>
        <FormValidationMessage for={name}>
          {#snippet children({ message })}
            <Icon icon={InfoIcon} size={12} />
            {message}
          {/snippet}
        </FormValidationMessage>
      </div>

      {#if rightText}
        <span class={css({ textStyle: '12m', color: 'neutral.70' })}>
          {@render rightText()}
        </span>
      {/if}
    </div>
  {/if}
</fieldset>
