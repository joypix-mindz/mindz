import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { useAFFiNEI18N } from '@affine/i18n/hooks';
import { assertExists } from '@blocksuite/global/utils';
import { EdgelessIcon, PageIcon } from '@blocksuite/icons';
import { useBlockSuitePageMeta } from '@toeverything/hooks/use-block-suite-page-meta';
import { useBlockSuiteWorkspaceHelper } from '@toeverything/hooks/use-block-suite-workspace-helper';
import { Command } from 'cmdk';
import { useAtomValue } from 'jotai';
import Image from 'next/legacy/image';
import type { NextRouter } from 'next/router';
import type { Dispatch, FC, SetStateAction } from 'react';
import { useEffect } from 'react';

import { recentPageSettingsAtom } from '../../../atoms';
import { useRouterHelper } from '../../../hooks/use-router-helper';
import type { BlockSuiteWorkspace } from '../../../shared';
import { useSwitchToConfig } from './config';
import { StyledListItem, StyledNotFound } from './style';

export type ResultsProps = {
  blockSuiteWorkspace: BlockSuiteWorkspace;
  query: string;
  onClose: () => void;
  setShowCreatePage: Dispatch<SetStateAction<boolean>>;
  router: NextRouter;
};
export const Results: FC<ResultsProps> = ({
  query,
  blockSuiteWorkspace,
  setShowCreatePage,
  router,
  onClose,
}) => {
  useBlockSuiteWorkspaceHelper(blockSuiteWorkspace);
  const pageList = useBlockSuitePageMeta(blockSuiteWorkspace);
  assertExists(blockSuiteWorkspace.id);
  const List = useSwitchToConfig(blockSuiteWorkspace.id);

  const recentPageSetting = useAtomValue(recentPageSettingsAtom);
  const t = useAFFiNEI18N();
  const { jumpToPage } = useRouterHelper(router);
  const results = blockSuiteWorkspace.search({ query });

  // remove `space:` prefix
  const pageIds = [...results.values()].map(id => id.slice(6));

  const resultsPageMeta = pageList.filter(
    page => pageIds.indexOf(page.id) > -1 && !page.trash
  );

  const recentlyViewedItem = recentPageSetting.filter(recent => {
    const page = pageList.find(page => recent.id === page.id);
    if (!page) {
      return false;
    } else {
      return page.trash !== true;
    }
  });
  useEffect(() => {
    setShowCreatePage(!resultsPageMeta.length);
    //Determine whether to display the  ‘+ New page’
  }, [resultsPageMeta.length, setShowCreatePage]);
  if (!query) {
    return (
      <>
        {recentlyViewedItem.length > 0 && (
          <Command.Group heading={t['Recent']()}>
            {recentlyViewedItem.map(recent => {
              const page = pageList.find(page => recent.id === page.id);
              assertExists(page);
              return (
                <Command.Item
                  key={page.id}
                  value={page.id}
                  onSelect={() => {
                    onClose();
                    jumpToPage(blockSuiteWorkspace.id, page.id).catch(
                      console.error
                    );
                  }}
                >
                  <StyledListItem>
                    {recent.mode === 'edgeless' ? (
                      <EdgelessIcon />
                    ) : (
                      <PageIcon />
                    )}
                    <span>{page.title || UNTITLED_WORKSPACE_NAME}</span>
                  </StyledListItem>
                </Command.Item>
              );
            })}
          </Command.Group>
        )}
        <Command.Group heading={t['Jump to']()}>
          {List.map(link => {
            return (
              <Command.Item
                key={link.title}
                value={link.title}
                onSelect={() => {
                  onClose();
                  router.push(link.href).catch(console.error);
                }}
              >
                <StyledListItem>
                  <link.icon />
                  <span>{link.title}</span>
                </StyledListItem>
              </Command.Item>
            );
          })}
        </Command.Group>
      </>
    );
  }
  if (!resultsPageMeta.length) {
    return (
      <StyledNotFound>
        <span>{t['Find 0 result']()}</span>
        <Image
          src="/imgs/no-result.svg"
          alt="no result"
          width={200}
          height={200}
        />
      </StyledNotFound>
    );
  }
  return (
    <Command.Group
      heading={t['Find results']({ number: `${resultsPageMeta.length}` })}
    >
      {resultsPageMeta.map(result => {
        return (
          <Command.Item
            key={result.id}
            onSelect={() => {
              onClose();
              assertExists(blockSuiteWorkspace.id);
              jumpToPage(blockSuiteWorkspace.id, result.id).catch(error =>
                console.error(error)
              );
            }}
            value={result.id}
          >
            <StyledListItem>
              {result.mode === 'edgeless' ? <EdgelessIcon /> : <PageIcon />}
              <span>{result.title || UNTITLED_WORKSPACE_NAME}</span>
            </StyledListItem>
          </Command.Item>
        );
      })}
    </Command.Group>
  );
};
