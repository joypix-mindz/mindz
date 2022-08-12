import { useState } from 'react';
import { message } from '@toeverything/components/ui';
import { PendantModifyPanel } from '../pendant-modify-panel';
import type { AsyncBlock } from '../../editor';
import {
    getRecastItemValue,
    type RecastBlockValue,
    type RecastMetaProperty,
} from '../../recast-block';
import { checkPendantForm, getPendantConfigByType } from '../utils';
import {
    StyledPopoverWrapper,
    StyledOperationLabel,
    StyledDivider,
    StyledPopoverContent,
    StyledPopoverSubTitle,
} from '../StyledComponent';
import { IconMap, pendantOptions } from '../config';
import { FieldTitleInput } from './FieldTitleInput';
import { useOnUpdateSure } from './hooks';

type Props = {
    value: RecastBlockValue;
    property: RecastMetaProperty;
    block: AsyncBlock;
    hasDelete?: boolean;
    onSure?: () => void;
    onCancel?: () => void;
    titleEditable?: boolean;
};

export const UpdatePendantPanel = ({
    value,
    property,
    block,
    hasDelete = false,
    onSure,
    onCancel,
    titleEditable = false,
}: Props) => {
    const pendantOption = pendantOptions.find(v => v.type === property.type);
    const iconConfig = getPendantConfigByType(property.type);
    const { removeValue } = getRecastItemValue(block);

    const Icon = IconMap[iconConfig.iconName];
    const [fieldName, setFieldName] = useState(property.name);
    const onUpdateSure = useOnUpdateSure({ block, property });

    return (
        <StyledPopoverWrapper>
            <StyledOperationLabel>Field Type</StyledOperationLabel>
            <StyledPopoverContent>
                <Icon
                    style={{
                        fontSize: 20,
                        marginRight: 12,
                        color: '#98ACBD',
                    }}
                />
                {property.type}
            </StyledPopoverContent>
            <StyledOperationLabel>Field Title</StyledOperationLabel>
            {titleEditable ? (
                <FieldTitleInput
                    value={fieldName}
                    onChange={e => {
                        setFieldName(e.target.value);
                    }}
                />
            ) : (
                <StyledPopoverContent>{property.name}</StyledPopoverContent>
            )}

            <StyledDivider />
            {pendantOption.subTitle && (
                <StyledPopoverSubTitle>
                    {pendantOption.subTitle}
                </StyledPopoverSubTitle>
            )}
            <PendantModifyPanel
                initialValue={
                    {
                        type: value.type,
                        value: value.value,
                    } as RecastBlockValue
                }
                iconConfig={getPendantConfigByType(property.type)}
                property={property}
                type={property.type}
                onSure={async (type, newPropertyItem, newValue) => {
                    const checkResult = checkPendantForm(
                        type,
                        fieldName,
                        newPropertyItem,
                        newValue
                    );

                    if (!checkResult.passed) {
                        await message.error(checkResult.message);
                        return;
                    }
                    await onUpdateSure({
                        type,
                        newPropertyItem,
                        newValue,
                        fieldName,
                    });
                    onSure?.();
                }}
                onDelete={
                    hasDelete
                        ? async () => {
                              await removeValue(property.id);
                          }
                        : null
                }
                onCancel={onCancel}
            />
        </StyledPopoverWrapper>
    );
};
