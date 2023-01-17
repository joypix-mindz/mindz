import {
  StyledSettingContainer,
  StyledSettingContent,
  StyledSettingSidebar,
  StyledSettingSidebarHeader,
  StyledSettingTabContainer,
  WorkspaceSettingTagItem,
} from '@/components/workspace-setting/style';
import { ReactElement, ReactNode, useState } from 'react';
import {
  GeneralPage,
  MembersPage,
  PublishPage,
  ExportPage,
  SyncPage,
} from '@/components/workspace-setting';
import { useAppState } from '@/providers/app-state-provider';
import WorkspaceLayout from '@/components/workspace-layout';
import { WorkspaceUnit } from '@affine/datacenter';
import { useTranslation } from '@affine/i18n';

type TabNames = 'general' | 'members' | 'publish' | 'sync' | 'export';

const tabMap: {
  name: TabNames;
  panelRender: (workspace: WorkspaceUnit) => ReactNode;
}[] = [
  {
    name: 'general',
    panelRender: workspace => <GeneralPage workspace={workspace} />,
  },
  {
    name: 'members',
    panelRender: workspace => <MembersPage workspace={workspace} />,
  },
  {
    name: 'publish',
    panelRender: workspace => <PublishPage workspace={workspace} />,
  },
  {
    name: 'sync',
    panelRender: workspace => <SyncPage workspace={workspace} />,
  },
  {
    name: 'export',
    panelRender: workspace => <ExportPage workspace={workspace} />,
  },
];

const WorkspaceSetting = () => {
  const { t } = useTranslation();
  const { currentWorkspace, isOwner } = useAppState();

  const [activeTab, setActiveTab] = useState<TabNames>(tabMap[0].name);
  const handleTabChange = (tab: TabNames) => {
    setActiveTab(tab);
  };

  const activeTabPanelRender = tabMap.find(
    tab => tab.name === activeTab
  )?.panelRender;
  let tableArr: {
    name: TabNames;
    panelRender: (workspace: WorkspaceUnit) => ReactNode;
  }[] = tabMap;
  if (!isOwner) {
    tableArr = [
      {
        name: 'general',
        panelRender: workspace => <GeneralPage workspace={workspace} />,
      },
    ];
  }
  return (
    <StyledSettingContainer>
      <StyledSettingSidebar>
        <StyledSettingSidebarHeader>
          {t('Workspace Settings')}
        </StyledSettingSidebarHeader>
        <StyledSettingTabContainer>
          {tableArr.map(({ name }) => {
            return (
              <WorkspaceSettingTagItem
                key={name}
                isActive={activeTab === name}
                onClick={() => {
                  handleTabChange(name);
                }}
              >
                {name}
              </WorkspaceSettingTagItem>
            );
          })}
        </StyledSettingTabContainer>
      </StyledSettingSidebar>

      <StyledSettingContent>
        {currentWorkspace && activeTabPanelRender?.(currentWorkspace)}
      </StyledSettingContent>
    </StyledSettingContainer>
  );
};
WorkspaceSetting.getLayout = function getLayout(page: ReactElement) {
  return <WorkspaceLayout>{page}</WorkspaceLayout>;
};

export default WorkspaceSetting;
