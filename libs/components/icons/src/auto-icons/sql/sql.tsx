
import { FC } from 'react';
// eslint-disable-next-line no-restricted-imports
import { SvgIcon } from '@mui/material';
// eslint-disable-next-line no-restricted-imports
import type { SvgIconProps } from '@mui/material';

export interface SqlIconProps extends Omit<SvgIconProps, 'color'> {
    color?: string
}

export const SqlIcon: FC<SqlIconProps> = ({ color, style, ...props}) => {
    const propsStyles = {"color": color};
    const customStyles = {};
    const styles = {...propsStyles, ...customStyles, ...style}
    return (
        <SvgIcon style={styles} {...props}>
        <path fillRule="evenodd" d="M18.41 4.857c-.224-.185-.628-.415-1.248-.636-1.25-.447-3.076-.751-5.162-.751s-3.911.304-5.162.751c-.62.221-1.024.451-1.248.636.224.185.628.415 1.248.636 1.25.447 3.076.751 5.162.751s3.911-.304 5.162-.75c.62-.222 1.024-.452 1.248-.637ZM12 7.714c2.617 0 4.94-.448 6.4-1.142v3.055c-.226.184-.627.41-1.238.628-1.25.447-3.076.751-5.162.751s-3.911-.304-5.162-.75c-.611-.219-1.012-.445-1.238-.629V6.572c1.46.694 3.783 1.142 6.4 1.142Zm-8 1.92V19.2h.002C4.087 20.752 7.635 22 12 22s7.913-1.248 7.998-2.8H20V5h-.01c.007-.047.01-.095.01-.143C20 3.28 16.418 2 12 2S4 3.28 4 4.857c0 .048.003.096.01.143H4v4.633Zm14.4 9.517v-3.055c-1.46.693-3.783 1.142-6.4 1.142-2.617 0-4.94-.449-6.4-1.142v3.055c.226.183.627.41 1.238.628 1.25.447 3.076.751 5.162.751s3.911-.304 5.162-.751c.611-.218 1.012-.445 1.238-.628ZM6.838 15.017c-.611-.218-1.012-.444-1.238-.628v-3.055c1.46.694 3.783 1.142 6.4 1.142 2.617 0 4.94-.449 6.4-1.142v3.055c-.226.184-.627.41-1.238.628-1.25.447-3.076.751-5.162.751s-3.911-.304-5.162-.751Z" clipRule="evenodd" />
        </SvgIcon>
    )
};
