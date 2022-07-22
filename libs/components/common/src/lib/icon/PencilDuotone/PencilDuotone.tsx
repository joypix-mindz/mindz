import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
/**
 * @deprecated Please use the icon from @toeverything/components/ui. If it does not exist, contact the designer to add。
 */
export const PencilDuotoneIcon: FC<SvgIconProps> = props => (
    <SvgIcon {...props}>
        <path
            style={{ fill: 'var(--color-0)' }}
            d="M8 14.779H20V15.779H8z"
            transform="rotate(-40.407 8 14.779)"
        />
        <path
            style={{ fill: 'var(--color-1)' }}
            d="M17.357 9.615A2.026 2.026 0 0 0 18 8.204a2.05 2.05 0 0 0-.534-1.457 2.069 2.069 0 0 0-1.354-.733 1.853 1.853 0 0 0-1.46.452l-7.007 6.19-1.538 2.985a.923.923 0 0 0 .123 1.036.945.945 0 0 0 .4.273c.192.067.4.067.592 0l3.13-1.138 7.006-6.197Zm-1.815-2.104a.497.497 0 0 1 .416-.117.708.708 0 0 1 .484.265.652.652 0 0 1 0 .912l-6.806 6.017-.546.203-.63-.78.26-.514 6.822-5.986Z"
        />
    </SvgIcon>
);
