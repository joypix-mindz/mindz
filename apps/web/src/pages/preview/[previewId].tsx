import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from 'next';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import { PageDetailEditor } from '../../components/page-detail-editor';
import { PageLoading } from '../../components/pure/loading';
import {
  StyledPage,
  StyledToolWrapper,
  StyledWrapper,
} from '../../layouts/styles';
import type { BlockSuiteWorkspace } from '../../shared';
import { createEmptyBlockSuiteWorkspace } from '../../utils';

export type PreviewPageProps = {
  text: string;
  title: string;
};

export type PreviewPageParams = {
  previewId: string;
};

const PreviewPage: NextPage<PreviewPageProps> = ({
  text,
  title,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [blockSuiteWorkspace, setBlockSuiteWorkspace] =
    useState<BlockSuiteWorkspace | null>(null);
  useEffect(() => {
    const blockSuiteWorkspace = createEmptyBlockSuiteWorkspace(
      'preview',
      (_: string) => undefined
    );
    blockSuiteWorkspace.slots.pageAdded.once(() => {
      setBlockSuiteWorkspace(blockSuiteWorkspace);
    });
    blockSuiteWorkspace.createPage('preview');
    return () => {
      blockSuiteWorkspace.removePage('preview');
    };
  }, []);
  if (!blockSuiteWorkspace || !blockSuiteWorkspace.getPage('preview')) {
    return <PageLoading />;
  }
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <StyledPage>
        <StyledWrapper>
          <PageDetailEditor
            isPreview
            blockSuiteWorkspace={blockSuiteWorkspace}
            pageId="preview"
            onInit={(page, editor) => {
              blockSuiteWorkspace.setPageMeta(page.id, { title });
              const pageBlockId = page.addBlockByFlavour('affine:page', {
                title: new page.Text(title),
              });
              page.addBlockByFlavour('affine:surface', {}, null);
              const frameId = page.addBlockByFlavour(
                'affine:frame',
                {},
                pageBlockId
              );
              page.addBlockByFlavour('affine:paragraph', {}, frameId);
              setTimeout(() => {
                // hotfix: contentParser.importMarkdown is not working in the first render
                editor.contentParser.importMarkdown(text, frameId).then(() => {
                  page.resetHistory();
                });
              }, 0);
            }}
          />
          <StyledToolWrapper>
            {/* fixme(himself65): remove this */}
            <div id="toolWrapper" style={{ marginBottom: '12px' }}>
              {/* Slot for block hub */}
            </div>
          </StyledToolWrapper>
        </StyledWrapper>
      </StyledPage>
    </>
  );
};

export default PreviewPage;

export const getStaticProps: GetStaticProps<
  PreviewPageProps,
  PreviewPageParams
> = async context => {
  const name = context.params?.previewId;
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const markdown: string = await fs.readFile(
    path.resolve(
      process.cwd(),
      '..',
      '..',
      'packages',
      'templates',
      'src',
      `${name}.md`
    ),
    'utf8'
  );
  const title = markdown
    .split('\n')
    .splice(0, 1)
    .join('')
    .replaceAll('#', '')
    .trim();
  if (!name) {
    return {
      redirect: {
        destination: '/404',
      },
      props: {
        text: '',
        title: '',
      },
    };
  }
  return {
    props: {
      text: markdown.split('\n').slice(1).join('\n'),
      title,
    },
  };
};

export const getStaticPaths: GetStaticPaths<PreviewPageParams> = () => {
  return {
    paths: [
      { params: { previewId: 'AFFiNE-Docs' } },
      { params: { previewId: 'Welcome-to-AFFiNE-Abbey-Alpha-Wood' } },
      { params: { previewId: 'Welcome-to-AFFiNE-Alpha-Downhills' } },
      { params: { previewId: 'Welcome-to-the-AFFiNE-Alpha' } },
    ],
    fallback: false,
  };
};
