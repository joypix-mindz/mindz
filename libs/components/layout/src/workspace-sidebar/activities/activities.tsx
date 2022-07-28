import { services } from '@toeverything/datasource/db-service';
import { useUserAndSpaces } from '@toeverything/datasource/state';
import { useCallback, useEffect, useState } from 'react';
import { styled } from '@toeverything/components/ui';
import {
    MuiList as List,
    MuiListItem as ListItem,
    MuiListItemText as ListItemText,
    MuiListItemButton as ListItemButton,
} from '@toeverything/components/ui';
import { useNavigate } from 'react-router';
import { formatDistanceToNow } from 'date-fns';

const StyledWrapper = styled('div')({
    margin: '0 16px 0 32px',
    span: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    '.item': {
        display: 'flex',
        alignItems: 'center',
        ustifyContent: 'space-between',
        padding: '7px 0px',
        whiteSpace: 'nowrap',
    },
    '.itemButton': {
        padding: 0,
        height: 32,
    },
    '.itemLeft': {
        color: '#4c6275',
        marginRight: '20px',
        span: {
            fontSize: 14,
        },
    },
    '.itemRight': {
        color: '#B6C7D3',
        flex: 'none',
        span: {
            fontSize: 12,
        },
    },
});

export const Activities = () => {
    const navigate = useNavigate();
    const { user, currentSpaceId } = useUserAndSpaces();
    const [recentPages, setRecentPages] = useState([]);
    const userId = user?.id;

    const fetchRecentPages = useCallback(async () => {
        if (!userId || !currentSpaceId) {
            return;
        }
        const recent_pages = await services.api.userConfig.getRecentPages(
            currentSpaceId,
            userId
        );
        setRecentPages(recent_pages);
    }, [userId, currentSpaceId]);

    useEffect(() => {
        (async () => {
            await fetchRecentPages();
        })();
    }, [fetchRecentPages]);

    useEffect(() => {
        let unobserve: () => void;
        const observe = async () => {
            unobserve = await services.api.userConfig.observe(
                { workspace: currentSpaceId },
                () => {
                    fetchRecentPages();
                }
            );
        };
        observe();

        return () => {
            unobserve?.();
        };
    }, [currentSpaceId, fetchRecentPages]);

    return (
        <StyledWrapper>
            <List>
                {recentPages.map(({ id, title, lastOpenTime }) => {
                    return (
                        <ListItem className="item" key={id}>
                            <ListItemButton
                                className="itemButton"
                                onClick={() => {
                                    navigate(`/${currentSpaceId}/${id}`);
                                }}
                            >
                                <ListItemText
                                    className="itemLeft"
                                    primary={title}
                                />
                                <ListItemText
                                    className="itemRight"
                                    primary={formatDistanceToNow(lastOpenTime, {
                                        includeSeconds: true,
                                    })}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </StyledWrapper>
    );
};
