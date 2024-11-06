import { renderAsync } from '@resvg/resvg-js';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import ky from 'ky';
import satori from 'satori';
import { db, first, Images, PageContents, Pages, Sites } from '@/db';

export const opengraph = new Hono();

const SUITMedium = await ky.get('https://cdn.rdbl.app/fonts/SUIT-Medium.otf').arrayBuffer();
const SUITExtraBold = await ky.get('https://cdn.rdbl.app/fonts/SUIT-ExtraBold.otf').arrayBuffer();

opengraph.get('/pages/:pageId', async (c) => {
  const [pageId] = c.req.param('pageId').split('.');

  const page = await db
    .select({
      title: PageContents.title,
      site: {
        logoPath: Images.path,
        name: Sites.name,
        themeColor: Sites.themeColor,
      },
    })
    .from(Pages)
    .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
    .innerJoin(Sites, eq(Pages.siteId, Sites.id))
    .leftJoin(Images, eq(Sites.logoId, Images.id))
    .where(eq(Pages.id, pageId))
    .then(first);

  if (!page) {
    throw new HTTPException(204);
  }

  const svg = await satori(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          width: '1012px',
          margin: '94px auto 0',
          fontFamily: 'SUIT',
        }}
      >
        {page.site.logoPath && (
          <div style={{ display: 'flex' }}>
            <img
              src={`https://usercontents.rdbl.app/images/${page.site.logoPath}?f=png`}
              width={124}
              height={124}
              style={{ borderRadius: '20px' }}
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '74px',
              fontWeight: 800,
              lineHeight: '134%',
              margin: 0,
              lineClamp: 2,
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              maxHeight: '199px',
              overflow: 'hidden',
            }}
          >
            {page.title}
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 500,
              lineHeight: '144%',
              textOverflow: 'ellipsis',
              color: '#A1A1AA',
              margin: 0,
            }}
          >
            {page.site.name}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
        }}
      ></div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '20px',
          backgroundColor: page.site.themeColor,
        }}
      ></div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'SUIT',
          data: SUITMedium,
          weight: 500,
        },
        {
          name: 'SUIT',
          data: SUITExtraBold,
          weight: 800,
        },
      ],
    },
  );

  const img = await renderAsync(svg, {
    font: { loadSystemFonts: false },
    imageRendering: 0,
    shapeRendering: 2,
    textRendering: 1,
  });

  return new Response(img.asPng(), {
    headers: {
      'Content-Type': 'image/png',
    },
  });
});
