
import { FC } from 'react';
// eslint-disable-next-line no-restricted-imports
import { SvgIcon } from '@mui/material';
// eslint-disable-next-line no-restricted-imports
import type { SvgIconProps } from '@mui/material';

export interface DateIconProps extends Omit<SvgIconProps, 'color'> {
    color?: string
}

export const DateIcon: FC<DateIconProps> = ({ color, style, ...props}) => {
    const propsStyles = {"color": color};
    const customStyles = {};
    const styles = {...propsStyles, ...customStyles, ...style}
    return (
        <SvgIcon style={styles} {...props}>
        <path fillRule="evenodd" d="M18 6.2H6a1.4 1.4 0 0 0-1.4 1.4V18A1.4 1.4 0 0 0 6 19.4h12a1.4 1.4 0 0 0 1.4-1.4V7.6A1.4 1.4 0 0 0 18 6.2ZM6 4.6a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7.6a3 3 0 0 0-3-3H6Z" clipRule="evenodd" /><path fillRule="evenodd" d="M20 11H4V9.4h16V11ZM8.8 3a.8.8 0 0 1 .8.8v3.4a.8.8 0 0 1-1.6 0V3.8a.8.8 0 0 1 .8-.8ZM15.2 8a.8.8 0 0 1-.8-.8V3.8a.8.8 0 0 1 1.6 0v3.4a.8.8 0 0 1-.8.8Z" clipRule="evenodd" />
        </SvgIcon>
    )
};
