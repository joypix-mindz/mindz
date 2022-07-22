import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
/**
 * @deprecated Please use the icon from @toeverything/components/ui. If it does not exist, contact the designer to add。
 */
export const ClockIcon: FC<SvgIconProps> = props => (
    <SvgIcon {...props}>
        <g fillRule="evenodd" clipPath="url(#a)" clipRule="evenodd">
            <path d="M11.746 2.29C6.13 2.29 1.558 6.86 1.558 12.476c0 5.617 4.571 10.187 10.188 10.187 5.617 0 10.188-4.57 10.188-10.187 0-5.618-4.57-10.188-10.188-10.188Zm0 21.874C5.302 24.164.058 18.921.058 12.477.058 6.032 5.302.79 11.746.79c6.444 0 11.688 5.243 11.688 11.688 0 6.444-5.244 11.687-11.688 11.687Z" />
            <path d="M15.424 14.55H9.799V6.615h1.5v6.437h4.125v1.5Z" />
        </g>
        <defs>
            <clipPath id="a">
                <path d="M0 0H24V24H0z" />
            </clipPath>
        </defs>
    </SvgIcon>
);
