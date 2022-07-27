import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { getPendantHistory } from '../utils';
import {
    getRecastItemValue,
    RecastMetaProperty,
    useRecastBlock,
    useRecastBlockMeta,
    RecastBlockValue,
    RecastPropertyId,
} from '../../recast-block';
import { AsyncBlock } from '../../editor';
import { Popover, PopperHandler, styled } from '@toeverything/components/ui';
import { PendantTag } from '../PendantTag';
import { UpdatePendantPanel } from '../pendant-operation-panel';

export const PendantHistoryPanel = ({
    block,
    endElement,
    onClose,
}: {
    block: AsyncBlock;
    endElement?: ReactNode;
    onClose?: () => void;
}) => {
    const groupBlock = useRecastBlock();
    const { getProperties } = useRecastBlockMeta();
    const { getProperty } = useRecastBlockMeta();

    const { getAllValue } = getRecastItemValue(block);
    const recastBlock = useRecastBlock();

    const [history, setHistory] = useState<RecastBlockValue[]>([]);
    const popoverHandlerRef = useRef<{ [key: string]: PopperHandler }>({});

    useEffect(() => {
        const init = async () => {
            const currentBlockValues = getAllValue();
            const allProperties = getProperties();
            const missProperties = allProperties.filter(
                property => !currentBlockValues.find(v => v.id === property.id)
            );
            const pendantHistory = getPendantHistory({
                recastBlockId: recastBlock.id,
            });
            const historyMap = missProperties.reduce<{
                [key: RecastPropertyId]: string;
            }>((history, property) => {
                if (pendantHistory[property.id]) {
                    history[property.id] = pendantHistory[property.id];
                }

                return history;
            }, {});

            const blockHistory = await Promise.all(
                Object.entries(historyMap).map(
                    async ([propertyId, blockId]) => {
                        const latestValueBlock = (
                            await groupBlock.children()
                        ).find((block: AsyncBlock) => block.id === blockId);

                        return getRecastItemValue(latestValueBlock).getValue(
                            propertyId as RecastPropertyId
                        );
                    }
                )
            );

            setHistory(blockHistory);
        };
        init();
    }, [getAllValue, getProperties, groupBlock, recastBlock]);

    return (
        <StyledPendantHistoryPanel>
            {history.map(item => {
                const property = getProperty(item.id);
                return (
                    <Popover
                        key={item.id}
                        ref={ref => {
                            popoverHandlerRef.current[item.id] = ref;
                        }}
                        placement="bottom-start"
                        content={
                            <UpdatePendantPanel
                                block={block}
                                value={item}
                                property={property}
                                hasDelete={false}
                                onSure={() => {
                                    popoverHandlerRef.current[
                                        item.id
                                    ].setVisible(false);
                                    onClose?.();
                                }}
                                onCancel={() => {
                                    popoverHandlerRef.current[
                                        item.id
                                    ].setVisible(false);
                                    onClose?.();
                                }}
                                titleEditable={false}
                            />
                        }
                        trigger="click"
                    >
                        <PendantTag
                            style={{
                                background: '#F5F7F8',
                                color: '#98ACBD',
                                marginRight: 12,
                                marginBottom: 8,
                            }}
                            property={property as RecastMetaProperty}
                            value={item}
                        />
                    </Popover>
                );
            })}
            {endElement}
        </StyledPendantHistoryPanel>
    );
};

const StyledPendantHistoryPanel = styled('div')`
    display: flex;
    flex-wrap: wrap;
`;
