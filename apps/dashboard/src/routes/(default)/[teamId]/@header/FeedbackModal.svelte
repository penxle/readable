<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import { graphql } from '$graphql';
  import { TitledModal } from '$lib/components';
  import { uploadBlobAsImage } from '$lib/utils/blob.svelte';

  type Props = {
    open?: boolean;
    teamId: string;
  };

  let { open = $bindable(false), teamId }: Props = $props();

  const createFeedbackMutation = graphql(`
    mutation CreateFeedback($input: CreateFeedbackInput!) {
      createFeedback(input: $input)
    }
  `);

  const { form, context, isValid, setFields } = createMutationForm({
    schema: z.object({
      teamId: dataSchemas.team.id,
      content: z.string().min(1),
    }),
    mutation: createFeedbackMutation,
    onSuccess: () => {
      toast.success('감사합니다. 피드백이 전송되었습니다');
      open = false;
    },
    onError: () => {
      toast.error('피드백 전송에 실패했습니다');
    },
  });

  let imageInputEl: HTMLInputElement;
  let contentEl: HTMLTextAreaElement;

  async function handleImageChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';

    if (!file) {
      return;
    }

    const resp = await uploadBlobAsImage(file, {
      ensureAlpha: true,
    });

    setFields('content', (content) => `${content}\n<${resp.url}|${file.name}>`);
    contentEl.scrollTo({ top: contentEl.scrollHeight, behavior: 'smooth' });
  }
</script>

<TitledModal bind:open>
  {#snippet title()}
    리더블 팀에 피드백 보내기
  {/snippet}

  <FormProvider {context} {form}>
    <input name="teamId" type="hidden" value={teamId} />
    <FormField name="content" noMessage>
      <label
        class={flex({
          align: 'center',
          borderWidth: '1px',
          borderColor: { base: 'gray.300', _dark: 'darkgray.700' },
          borderRadius: '10px',
          paddingX: '16px',
          paddingY: '10px',
          textStyle: '16r',
          color: 'gray.1000',
          backgroundColor: 'white',
          transition: 'common',
          _hover: {
            borderColor: 'brand.400',
          },
          '&:has(textarea:focus)': {
            borderColor: 'brand.600',
          },
        })}
      >
        <textarea
          bind:this={contentEl}
          name="content"
          class={css({
            flexGrow: '1',
            width: 'full',
            minWidth: '0',
            resize: 'none',
          })}
          placeholder="기능 요청, 버그 제보, 개선 제안 등 하고 싶으신 말씀을 자유롭게 적어주세요"
          rows="4"
        ></textarea>
      </label>
    </FormField>
    <div class={flex({ gap: '8px', marginTop: '20px' })}>
      <Button
        style={css.raw({ width: '140px' })}
        onclick={() => imageInputEl.click()}
        size="lg"
        type="button"
        variant="secondary"
      >
        이미지 첨부
      </Button>
      <input bind:this={imageInputEl} accept="image/*" hidden onchange={handleImageChange} type="file" />
      <Button style={css.raw({ flexGrow: '1' })} disabled={!isValid} glossy size="lg" type="submit">보내기</Button>
    </div>
  </FormProvider>
</TitledModal>
