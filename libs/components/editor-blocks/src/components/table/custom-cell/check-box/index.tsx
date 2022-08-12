import { Checkbox } from '@toeverything/components/ui';
import type { BooleanColumnValue } from '@toeverything/datasource/db-service';
import type { CellProps } from '../types';

/**
 * @deprecated
 */
export const CheckBoxCell = ({
    value,
    onChange,
}: CellProps<BooleanColumnValue>) => {
    return (
        <Checkbox
            checked={value?.value}
            onChange={event => onChange({ value: event.target.checked })}
        />
    );
};
