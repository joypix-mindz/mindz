import { type CSSProperties, type PropsWithChildren } from 'react';
import { placementToContainerDirection, PopoverContainer } from '../popover';
import { Popper, type PopperProps } from '../popper';
import { useTheme } from '../theme';
import type { TooltipProps } from './interface';

const useTooltipStyle = (): CSSProperties => {
    const theme = useTheme();
    return {
        backgroundColor: theme.affine.palette.icons,
        color: theme.affine.palette.white,
        ...theme.affine.typography.tooltip,
        padding: '4px 8px',
    };
};

export const Tooltip = (
    props: PropsWithChildren<PopperProps & TooltipProps>
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
