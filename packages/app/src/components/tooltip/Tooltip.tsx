import { type CSSProperties, type PropsWithChildren } from 'react';
import { PopoverContainer } from './Container';
import { Popper, type PopperProps } from '../popper';
import { useTheme } from '@/styles';
import type { PopperPlacementType, TooltipProps } from '@mui/material';
import type { PopoverDirection } from './interface';
export const placementToContainerDirection: Record<
  PopperPlacementType,
  PopoverDirection
> = {
  top: 'none',
  'top-start': 'left-bottom',
  'top-end': 'right-bottom',
  right: 'none',
  'right-start': 'left-top',
  'right-end': 'left-bottom',
  bottom: 'none',
  'bottom-start': 'left-top',
  'bottom-end': 'right-top',
  left: 'none',
  'left-start': 'right-top',
  'left-end': 'right-bottom',
  auto: 'none',
  'auto-start': 'none',
  'auto-end': 'none',
};

const useTooltipStyle = (): CSSProperties => {
  const theme = useTheme();
  return {};
  // return {
  //     backgroundColor: theme.affine.palette.icons,
  //     color: theme.affine.palette.white,
  //     ...theme.affine.typography.tooltip,
  //     padding: '4px 8px',
  // };
};

export const Tooltip = (
  props: PropsWithChildren<PopperProps & Omit<TooltipProps, 'title'>>
) => {
  const { content, placement = 'top-start' } = props;
  const style = useTooltipStyle();
  // If there is no content, hide forever
  const visibleProp = content ? {} : { visible: false };
  return (
    <Popper
      {...visibleProp}
      placement="top"
      {...props}
      showArrow={false}
      content={
        <PopoverContainer
          style={style}
          direction={placementToContainerDirection[placement]}
        >
          {content}
        </PopoverContainer>
      }
    />
  );
};
