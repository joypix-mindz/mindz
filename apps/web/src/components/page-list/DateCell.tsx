import { TableCell } from '@affine/component';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import React from 'react';

import { PageMeta } from '@/providers/app-state-provider';

dayjs.extend(localizedFormat);

export const DateCell = ({
  pageMeta,
  dateKey,
  backupKey = '',
}: {
  pageMeta: PageMeta;
  dateKey: keyof PageMeta;
  backupKey?: keyof PageMeta;
}) => {
  // dayjs().format('L LT');
  const value = pageMeta[dateKey] ?? pageMeta[backupKey];
  return (
    <TableCell ellipsis={true}>
      {value ? dayjs(value as string).format('YYYY-MM-DD HH:mm') : '--'}
    </TableCell>
  );
};

export default DateCell;
