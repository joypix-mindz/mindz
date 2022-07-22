import type { FC, ReactNode } from 'react';
import { Tooltip, styled, IconButton } from '@toeverything/components/ui';

interface PenProps {
    name: string;
    icon: ReactNode;
    primaryColor: string;
    secondaryColor: string;
    onClick: () => void;
}

export const Pen: FC<PenProps> = ({
    name,
    icon,
    primaryColor,
    secondaryColor,
    onClick,
}) => {
    return (
        <Tooltip content={name}>
            <StyledIconButton
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onClick={onClick}
            >
                {icon}
            </StyledIconButton>
        </Tooltip>
    );
};

const StyledIconButton = styled(IconButton, {
    shouldForwardProp: propName =>
        !['primaryColor', 'secondaryColor'].some(name => name === propName),
})<Pick<PenProps, 'primaryColor' | 'secondaryColor'>>(
    ({ primaryColor, secondaryColor }) => {
        return {
            '--color-0': primaryColor,
            '--color-1': secondaryColor,
            width: '40px',
            height: '40px',
        };
    }
);
