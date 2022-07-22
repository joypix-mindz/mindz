
import { FC } from 'react';
// eslint-disable-next-line no-restricted-imports
import { SvgIcon } from '@mui/material';
// eslint-disable-next-line no-restricted-imports
import type { SvgIconProps } from '@mui/material';

export interface DoneIconProps extends Omit<SvgIconProps, 'color'> {
    color?: string
}

export const DoneIcon: FC<DoneIconProps> = ({ color, style, ...props}) => {
    const propsStyles = {"color": color};
    const customStyles = {};
    const styles = {...propsStyles, ...customStyles, ...style}
    return (
        <SvgIcon style={styles} {...props}>
        <path fillRule="evenodd" d="M21.207 7.207 9 19.414l-6.207-6.207 1.414-1.414L9 16.586 19.793 5.793l1.414 1.414Z" clipRule="evenodd" />
        </SvgIcon>
    )
};
