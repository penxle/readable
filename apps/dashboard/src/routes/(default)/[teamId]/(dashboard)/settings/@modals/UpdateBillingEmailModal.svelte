<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Button, FormField, FormProvider, TextInput } from '@readable/ui/components';
  import { createMutationForm } from '@readable/ui/forms';
  import { toast } from '@readable/ui/notification';
  import mixpanel from 'mixpanel-browser';
  import { z } from 'zod';
  import { dataSchemas } from '@/schemas';
  import { graphql } from '$graphql';
  import { TitledModal } from '$lib/components';

  type Props = {
    open?: boolean;
    teamId: string;
  };

  let { open = $bindable(false), teamId }: Props = $props();

  const { form, isValid, context } = createMutationForm({
    mutation: graphql(`
      mutation UpdateBillingEmail($input: UpdateBillingEmailInput!) {
        updateBillingEmail(input: $input) {
          id
          plan {
            id
            billingEmail
          }
        }
      }
    `),
    schema: z.object({
      teamId: dataSchemas.team.id,
      billingEmail: dataSchemas.email,
    }),
    onSuccess: async () => {
      toast.success('청구서 수신 이메일이 변경되었습니다');
      open = false;
      mixpanel.track('billing:update-email:success');
    },
    onError: () => {
      toast.error('이메일 변경에 실패했습니다');
      mixpanel.track('billing:update-email:fail');
    },
  });
</script>

<TitledModal bind:open>
  {#snippet title()}
    청구서 수신 이메일 변경
  {/snippet}

  <FormProvider class={flex({ flexDirection: 'column', gap: '20px' })} {context} {form}>
    <input name="teamId" type="hidden" value={teamId} />

    <p class={css({ textStyle: '14r', color: 'text.tertiary' })}>
      청구서 수신 이메일을 변경합니다. 변경된 이메일로 청구서가 발송됩니다.
    </p>

    <FormField name="billingEmail" label="새 이메일 주소">
      <TextInput name="billingEmail" placeholder="me@example.com" />
    </FormField>

    <Button style={css.raw({ marginTop: '20px' })} disabled={!$isValid} type="submit">변경</Button>
  </FormProvider>
</TitledModal>
