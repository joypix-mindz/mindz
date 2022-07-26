import { Outlet } from 'react-router-dom';

import { styled } from '@toeverything/components/ui';
import { SettingsSidebar, LayoutHeader } from '@toeverything/components/layout';

export function LigoVirgoRootContainer() {
    return (
        <StyledRootContainer id="idAppRoot">
            <StyledContentContainer>
                <LayoutHeader />
                <StyledMainContainer>
                    <Outlet />
                </StyledMainContainer>
            </StyledContentContainer>
            <SettingsSidebar />
        </StyledRootContainer>
    );
}

const StyledMainContainer = styled('div')({
    flex: 'auto',
    display: 'flex',
    overflowY: 'hidden',
});

const StyledRootContainer = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
});

const StyledContentContainer = styled('div')({
    flex: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
});
