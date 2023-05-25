import {
  Content,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@affine/component';
import { useAFFiNEI18N } from '@affine/i18n/hooks';

import type { ListData } from './all-page';
import { AllPagesBody } from './all-pages-body';
import { NewPageButton } from './components/new-page-buttton';
import {
  StyledTableContainer,
  StyledTableRow,
  StyledTitleLink,
} from './styles';

const MobileHead = ({
  isPublicWorkspace,
  createNewPage,
  createNewEdgeless,
}: {
  isPublicWorkspace: boolean;
  createNewPage: () => void;
  createNewEdgeless: () => void;
}) => {
  const t = useAFFiNEI18N();
  return (
    <TableHead>
      <TableRow>
        <TableCell proportion={0.8}>{t['Title']()}</TableCell>
        {!isPublicWorkspace && (
          <TableCell>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <NewPageButton
                createNewPage={createNewPage}
                createNewEdgeless={createNewEdgeless}
              />
            </div>
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
};

export const AllPageListMobileView = ({
  list,
  isPublicWorkspace,
  createNewPage,
  createNewEdgeless,
}: {
  isPublicWorkspace: boolean;
  list: ListData[];
  createNewPage: () => void;
  createNewEdgeless: () => void;
}) => {
  return (
    <StyledTableContainer>
      <Table>
        <MobileHead
          isPublicWorkspace={isPublicWorkspace}
          createNewPage={createNewPage}
          createNewEdgeless={createNewEdgeless}
        />
        <AllPagesBody isPublicWorkspace={isPublicWorkspace} data={list} />
      </Table>
    </StyledTableContainer>
  );
};

// TODO align to {@link AllPageListMobileView}
export const TrashListMobileView = ({
  list,
}: {
  list: {
    pageId: string;
    title: string;
    icon: JSX.Element;
    onClickPage: () => void;
  }[];
}) => {
  const t = useAFFiNEI18N();

  const ListItems = list.map(({ pageId, title, icon, onClickPage }, index) => {
    return (
      <StyledTableRow
        data-testid={`page-list-item-${pageId}`}
        key={`${pageId}-${index}`}
      >
        <TableCell onClick={onClickPage}>
          <StyledTitleLink>
            {icon}
            <Content ellipsis={true} color="inherit">
              {title || t['Untitled']()}
            </Content>
          </StyledTitleLink>
        </TableCell>
      </StyledTableRow>
    );
  });

  return (
    <StyledTableContainer>
      <Table>
        <TableBody>{ListItems}</TableBody>
      </Table>
    </StyledTableContainer>
  );
};
