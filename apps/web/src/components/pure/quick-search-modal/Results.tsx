import { useTranslation } from '@affine/i18n';
import { EdgelessIcon, PaperIcon } from '@blocksuite/icons';
import { assertExists } from '@blocksuite/store';
import { Command } from 'cmdk';
import { NextRouter } from 'next/router';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { useBlockSuiteWorkspaceHelper } from '../../../hooks/use-blocksuite-workspace-helper';
import { usePageMeta } from '../../../hooks/use-page-meta';
import { BlockSuiteWorkspace } from '../../../shared';
import { useSwitchToConfig } from './config';
import { NoResultSVG } from './NoResultSVG';
import { StyledListItem, StyledNotFound } from './style';

export type ResultsProps = {
  blockSuiteWorkspace: BlockSuiteWorkspace;
  query: string;
  loading: boolean;
  onClose: () => void;
  setShowCreatePage: Dispatch<SetStateAction<boolean>>;
  router: NextRouter;
};
export const Results: React.FC<ResultsProps> = ({
  query,
  loading,
  blockSuiteWorkspace,
  setShowCreatePage,
  router,
  onClose,
}) => {
  useBlockSuiteWorkspaceHelper(blockSuiteWorkspace);
  const pageList = usePageMeta(blockSuiteWorkspace);
  assertExists(blockSuiteWorkspace.room);
  const List = useSwitchToConfig(blockSuiteWorkspace.room);
  const [results, setResults] = useState(new Map<string, string | undefined>());
  const { t } = useTranslation();
  useEffect(() => {
    setResults(blockSuiteWorkspace.search(query));
    //Save the Map<BlockId, PageId> obtained from the search as state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, setResults]);
  const pageIds = [...results.values()];

  const resultsPageMeta = pageList.filter(
    page => pageIds.indexOf(page.id) > -1 && !page.trash
  );

  useEffect(() => {
    setShowCreatePage(!resultsPageMeta.length);
    //Determine whether to display the  ‘+ New page’
  }, [resultsPageMeta.length, setShowCreatePage]);
  return loading ? null : (
    <>
      {query ? (
        resultsPageMeta.length ? (
          <Command.Group
            heading={t('Find results', { number: resultsPageMeta.length })}
          >
            {resultsPageMeta.map(result => {
              return (
                <Command.Item
                  key={result.id}
                  onSelect={() => {
                    onClose();
                    assertExists(blockSuiteWorkspace.room);
                    // fixme: refactor to `useRouterHelper`
                    router.push({
                      pathname: '/workspace/[workspaceId]/[pageId]',
                      query: {
                        workspaceId: blockSuiteWorkspace.room,
                        pageId: result.id,
                      },
                    });
                  }}
                  value={result.id}
                >
                  <StyledListItem>
                    {result.mode === 'edgeless' ? (
                      <EdgelessIcon />
                    ) : (
                      <PaperIcon />
                    )}
                    <span>{result.title}</span>
                  </StyledListItem>
                </Command.Item>
              );
            })}
          </Command.Group>
        ) : (
          <StyledNotFound>
            <span>{t('Find 0 result')}</span>
            <NoResultSVG />
          </StyledNotFound>
        )
      ) : (
        <Command.Group heading={t('Jump to')}>
          {List.map(link => {
            return (
              <Command.Item
                key={link.title}
                value={link.title}
                onSelect={() => {
                  onClose();
                  router.push(link.href);
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
      )}
    </>
  );
};
