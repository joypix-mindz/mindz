import { LogoImg } from '@toeverything/components/common';
import { MuiBox, MuiGrid, MuiSnackbar } from '@toeverything/components/ui';
import { useCallback, useState } from 'react';

import { Error } from './../error';
// import { Authing } from './Authing';
import { FileSystem } from './FileSystem';
import { Firebase } from './Firebase';

export function Login() {
    const [error, setError] = useState(false);

    const onError = useCallback(() => {
        setError(true);
        setTimeout(() => setError(false), 3000);
    }, []);

    return (
        <MuiGrid container>
            <MuiSnackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={error}
                message="Request File Permission failed, please check if you have permission"
            />
            <MuiGrid item xs={8}>
                <Error
                    title="Welcome to AFFiNE"
                    subTitle="blocks of knowledge to power your team"
                    action1Text="Login &nbsp; or &nbsp; Register"
                />
            </MuiGrid>

            <MuiGrid item xs={4}>
                <MuiBox
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        rowGap: '1em',
                        width: '300px',
                        margin: '300px  auto 20px auto',
                    }}
                    sx={{ mt: 1 }}
                >
                    <LogoImg
                        style={{
                            width: '100px',
                        }}
                    />
                    {(process.env['NX_LOCAL'] && (
                        <FileSystem onError={onError} />
                    )) ||
                        null}
                    {(!process.env['NX_LOCAL'] && (
                        <Firebase onError={onError} />
                    )) ||
                        null}
                </MuiBox>
            </MuiGrid>
        </MuiGrid>
    );
}
