import { useTranslation } from '@affine/i18n';
import { EdgelessIcon, PaperIcon } from '@blocksuite/icons';
import { Workspace } from '@blocksuite/store';
import { Command } from 'cmdk';
import { useRouter } from 'next/router';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import usePageHelper from '@/hooks/use-page-helper';
import { PageMeta } from '@/providers/app-state-provider';
import { useGlobalState } from '@/store/app';

import { NoResultSVG } from './NoResultSVG';
import { StyledListItem, StyledNotFound } from './style';

export const PublishedResults = (props: {
  query: string;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setPublishWorkspaceName: Dispatch<SetStateAction<string>>;
  onClose: () => void;
}) => {
  const [workspace, setWorkspace] = useState<Workspace>();
  const { query, loading, setLoading, onClose, setPublishWorkspaceName } =
    props;
  const { search } = usePageHelper();
  const [results, setResults] = useState(new Map<string, string | undefined>());
  const dataCenter = useGlobalState(store => store.dataCenter);
  const router = useRouter();
  const [pageList, setPageList] = useState<PageMeta[]>([]);
  useEffect(() => {
    dataCenter
      .loadPublicWorkspace(router.query.workspaceId as string)
      .then(data => {
        setPageList(data.blocksuiteWorkspace?.meta.pageMetas as PageMeta[]);
        if (data.blocksuiteWorkspace) {
          setWorkspace(data.blocksuiteWorkspace);
          setPublishWorkspaceName(data.blocksuiteWorkspace.meta.name);
        }
      })
      .catch(() => {
        router.push('/404');
      });
  }, [router, dataCenter, setPublishWorkspaceName]);
  const { t } = useTranslation();
  useEffect(() => {
    setResults(search(query, workspace));
    setLoading(false);
    //Save the Map<BlockId, PageId> obtained from the search as state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, setResults, setLoading]);
  const pageIds = [...results.values()];
  const resultsPageMeta = pageList.filter(
    page => pageIds.indexOf(page.id) > -1 && !page.trash
  );

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
                    router.push(
                      `/public-workspace/${router.query.workspaceId}/${result.id}`
                    );
                    onClose();
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
        <></>
      )}
    </>
  );
};
