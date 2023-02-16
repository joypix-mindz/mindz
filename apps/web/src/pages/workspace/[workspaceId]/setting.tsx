import {
  StyledSettingContainer,
  StyledSettingContent,
  WorkspaceSettingTagItem,
} from '@/components/workspace-setting/style';
import {
  ReactElement,
  ReactNode,
  useState,
  CSSProperties,
  useEffect,
  startTransition,
  useCallback,
} from 'react';
import {
  GeneralPage,
  MembersPage,
  PublishPage,
  ExportPage,
} from '@/components/workspace-setting';
import { SettingsIcon } from '@blocksuite/icons';
import WorkspaceLayout from '@/components/workspace-layout';
import { WorkspaceUnit } from '@affine/datacenter';
import { useTranslation } from '@affine/i18n';
import { PageListHeader } from '@/components/header';
import Head from 'next/head';
import { styled } from '@affine/component';
import { useGlobalState } from '@/store/app';

const useTabMap = () => {
  const { t } = useTranslation();
  const isOwner = useGlobalState(store => store.isOwner);
  const tabMap: {
    id: string;
    name: string;
    panelRender: (workspace: WorkspaceUnit) => ReactNode;
  }[] = [
    {
      id: 'General',
      name: t('General'),
      panelRender: workspace => <GeneralPage workspace={workspace} />,
    },
    // TODO: add it back for desktop version
    // {
    //   name: t('Sync'),
    //   panelRender: workspace => <SyncPage workspace={workspace} />,
    // },
    {
      id: 'Collaboration',
      name: t('Collaboration'),
      panelRender: workspace => <MembersPage workspace={workspace} />,
    },
    {
      id: 'Publish',
      name: t('Publish'),
      panelRender: workspace => <PublishPage workspace={workspace} />,
    },
    // TODO: next version will finish this feature
    {
      id: 'Export',
      name: t('Export'),
      panelRender: workspace => <ExportPage workspace={workspace} />,
    },
  ];
  const [activeTab, setActiveTab] = useState<string>(tabMap[0].id);
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const activeTabPanelRender = tabMap.find(
    tab => tab.id === activeTab
  )?.panelRender;

  return {
    activeTabPanelRender,
    tabMap: isOwner ? tabMap : tabMap.slice(0, 1),
    handleTabChange,
    activeTab,
  };
};

const StyledIndicator = styled.div(({ theme }) => {
  return {
    height: '2px',
    background: theme.colors.primaryColor,
    position: 'absolute',
    left: '0',
    bottom: '0',
    transition: 'left .3s, width .3s',
  };
});
const StyledTabButtonWrapper = styled.div(() => {
  return {
    display: 'flex',
    position: 'relative',
  };
});
const WorkspaceSetting = () => {
  const { t } = useTranslation();
  const currentWorkspace = useGlobalState(
    useCallback(store => store.currentDataCenterWorkspace, [])
  );
  const { activeTabPanelRender, tabMap, handleTabChange, activeTab } =
    useTabMap();

  const [indicatorState, setIndicatorState] = useState<
    Pick<CSSProperties, 'left' | 'width'>
  >({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const tabButton = document.querySelector(
      `[data-setting-tab-button="${activeTab}"]`
    );
    if (tabButton instanceof HTMLElement) {
      startTransition(() => {
        setIndicatorState({
          width: `${tabButton.offsetWidth}px`,
          left: `${tabButton.offsetLeft}px`,
        });
      });
    }
  }, [activeTab]);

  return (
    <>
      <Head>
        <title>{t('Settings')} - AFFiNE</title>
      </Head>
      <PageListHeader icon={<SettingsIcon />}>{t('Settings')}</PageListHeader>

      <StyledSettingContainer>
        <StyledTabButtonWrapper>
          {tabMap.map(({ id, name }) => {
            return (
              <WorkspaceSettingTagItem
                key={id}
                isActive={activeTab === id}
                data-setting-tab-button={id}
                onClick={() => {
                  handleTabChange(id);
                }}
              >
                {name}
              </WorkspaceSettingTagItem>
            );
          })}
          <StyledIndicator style={indicatorState} />
        </StyledTabButtonWrapper>

        <StyledSettingContent>
          {currentWorkspace && activeTabPanelRender?.(currentWorkspace)}
        </StyledSettingContent>
      </StyledSettingContainer>
    </>
  );
};
WorkspaceSetting.getLayout = function getLayout(page: ReactElement) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};

export default WorkspaceSetting;
