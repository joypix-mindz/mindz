import { styled } from '@/styles';
import { WorkspaceInfo } from '@affine/datacenter';

export const ExportPageTitleContainer = styled('div')(() => {
  return {
    display: 'flex',
    marginTop: '60px',
    fontWeight: '500',
    flex: 1,
  };
});
export const ExportPage = ({ workspace }: { workspace: WorkspaceInfo }) => {
  return (
    <ExportPageTitleContainer>
      Export Workspace{' '}
      <code style={{ margin: '0 10px' }}>{workspace.name}</code> Is Comming
    </ExportPageTitleContainer>
  );
};
