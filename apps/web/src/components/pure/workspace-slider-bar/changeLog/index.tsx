import { IconButton } from '@affine/component';
import { useTranslation } from '@affine/i18n';
import { CloseIcon, DoneIcon } from '@blocksuite/icons';
import { useCallback } from 'react';

import {
  useGuideHidden,
  useGuideHiddenUntilNextUpdate,
} from '../../../../hooks/affine/use-is-first-load';
import { StyledListItem } from '../shared-styles';
import { StyledLink } from '../style';
export const ChangeLog = () => {
  const [guideHidden, setGuideHidden] = useGuideHidden();
  const [guideHiddenUntilNextUpdate, setGuideHiddenUntilNextUpdate] =
    useGuideHiddenUntilNextUpdate();
  const { t } = useTranslation();
  const onCloseWhatsNew = useCallback(() => {
    setGuideHiddenUntilNextUpdate({
      ...guideHiddenUntilNextUpdate,
      changeLog: true,
    });
    setGuideHidden({ ...guideHidden, changeLog: true });
  }, [
    guideHidden,
    guideHiddenUntilNextUpdate,
    setGuideHidden,
    setGuideHiddenUntilNextUpdate,
  ]);
  if (guideHiddenUntilNextUpdate.changeLog) {
    return <></>;
  }
  return (
    <>
      <StyledListItem data-testid="change-log">
        <StyledLink href={'https://affine.pro'} target="_blank">
          <DoneIcon />
          {t("Discover what's new!")}
        </StyledLink>
        <IconButton
          onClick={() => {
            onCloseWhatsNew();
          }}
          data-testid="change-log-close-button"
        >
          <CloseIcon />
        </IconButton>
      </StyledListItem>
    </>
  );
};

export default ChangeLog;
