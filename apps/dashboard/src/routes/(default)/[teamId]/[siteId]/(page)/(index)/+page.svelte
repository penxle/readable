<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex } from '@readable/styled-system/patterns';
  import { Helmet, Icon } from '@readable/ui/components';
  import FilePenIcon from '~icons/lucide/file-pen';
  import FileTextIcon from '~icons/lucide/file-text';
  import { graphql } from '$graphql';

  let query = $derived(
    graphql(`
      query SitePage_Query($siteId: ID!) {
        site(siteId: $siteId) {
          id
          name
          hasPage

          team {
            id
          }
        }
      }
    `),
  );
</script>

<Helmet title={$query.site.name} />

<div class={flex({ direction: 'column', align: 'center', justify: 'center', gap: '24px', width: 'full' })}>
  <Icon style={css.raw({ size: '60px' })} icon={$query.site.hasPage ? FileTextIcon : FilePenIcon} />
  <div class={css({ textAlign: 'center' })}>
    <h1 class={css({ textStyle: '22b', marginBottom: '4px' })}>
      {$query.site.hasPage ? '페이지를 선택해주세요' : '첫 페이지를 만들어보세요'}
    </h1>
    <p class={css({ textStyle: '15r', color: 'text.secondary' })}>
      {$query.site.hasPage ? '왼쪽 사이드바에서 편집할 페이지를 선택해주세요' : '아직 생성된 페이지가 없습니다'}
    </p>
  </div>
</div>
