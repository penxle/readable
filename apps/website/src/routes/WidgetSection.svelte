<script lang="ts">
  import { css } from '@readable/styled-system/css';
  import { flex, wrap } from '@readable/styled-system/patterns';
  import image1 from '../assets/widget-section/widget-1.webp';
  import image2 from '../assets/widget-section/widget-2.webp';
  import widgetDemoMp4 from '../assets/widget-section/widget-demo.mp4';
  import widgetDemoWebm from '../assets/widget-section/widget-demo.webm';
  import SectionTitle from './SectionTitle.svelte';
</script>

<div class={css({ backgroundColor: '[#FFF2EA]' })}>
  <div
    class={flex({
      flexDirection: 'column',
      gap: '32px',
      paddingX: '20px',
      paddingY: '54px',
      maxWidth: '960px',
      marginX: 'auto',
      lg: {
        paddingY: '80px',
        gap: '42px',
      },
    })}
  >
    <SectionTitle color="#FF5E00">
      {#snippet subtitle()}
        컴패니언 위젯
      {/snippet}
      {#snippet title()}
        상담보다 빠르게, <br />
        검색보다 친절하게
      {/snippet}
      {#snippet description()}
        <p>
          <span>
            이용자가 어려움을 겪는 그 순간, 가장 적합한 도움말을 자동으로 실시간 제안합니다.
            <br />
            페이지를 떠나지 않고도 서비스 내에서 바로 도움말을 제공해보세요.
          </span>
        </p>
      {/snippet}
    </SectionTitle>
    <div
      class={wrap({
        gap: '20px',
        lg: {
          gap: '32px',
        },
      })}
    >
      <video
        class={css({ width: 'full', borderRadius: '[20px]', borderWidth: '1px', borderColor: 'border.primary' })}
        autoplay
        loop
        muted
      >
        <source src={widgetDemoWebm} type="video/webm" />
        <source src={widgetDemoMp4} type="video/mp4" />

        브라우저가 비디오를 지원하지 않습니다.
      </video>

      <div
        class={css({
          padding: '32px',
          paddingBottom: '0',
          backgroundColor: '[#FF7B2E]',
          borderRadius: '[20px]',
          color: 'white',
          width: 'full',
          lg: {
            width: '[calc(50% - 16px)]',
          },
        })}
      >
        <h2 class={css({ fontSize: '22px', fontWeight: '[700]', smOnly: { fontSize: '18px' } })}>
          맥락을 이해하는 문서 제안
        </h2>
        <p class={css({ marginTop: '4px', fontSize: '16px', fontWeight: '[500]', smOnly: { fontSize: '14px' } })}>
          지금 이용자가 보고 있는 내용을 이해하고
          <br />
          가장 필요한 가이드 문서를 자동으로 제안합니다
        </p>
        <img
          class={css({
            marginTop: '49px',
            marginX: 'auto',
            mdOnly: { maxWidth: '400px' },
            smOnly: { maxWidth: '[calc(100% - 64px)]' },
          })}
          alt="위젯이 현재 페이지에 대한 추천 문서를 보여주는 예시"
          src={image1}
        />
      </div>

      <div
        class={css({
          padding: '32px',
          paddingBottom: '0',
          backgroundColor: 'neutral.90',
          borderRadius: '[20px]',
          color: 'white',
          width: 'full',
          lg: {
            width: '[calc(50% - 16px)]',
          },
        })}
      >
        <h2 class={css({ fontSize: '22px', fontWeight: '[700]', smOnly: { fontSize: '18px' } })}>AI 문의</h2>
        <p class={css({ marginTop: '4px', fontSize: '16px', fontWeight: '[500]', smOnly: { fontSize: '14px' } })}>
          도움센터를 통째로 이해하는 AI 문의를 통해 <br />
          어떤 질문이든 서비스 내에서 빠르게 해결할 수 있습니다
        </p>
        <img
          class={css({
            marginTop: '49px',
            marginX: 'auto',
            mdOnly: { maxWidth: '400px' },
            smOnly: { maxWidth: '[calc(100% - 64px)]' },
          })}
          alt="위젯이 유저의 질문을 이해하고 답변을 제공하는 예시"
          src={image2}
        />
      </div>
    </div>
  </div>
</div>
