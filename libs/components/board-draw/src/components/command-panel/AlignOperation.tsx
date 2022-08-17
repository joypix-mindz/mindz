import type { TldrawApp } from '@toeverything/components/board-state';
import { StretchType, TDShape } from '@toeverything/components/board-types';
import {
    AlignHorizontalCenterIcon,
    AlignIcon,
    AlignToBottomIcon,
    AlignToLeftIcon,
    AlignToRightIcon,
    AlignToTopIcon,
    AlignVerticalCenterIcon,
    DistributeHorizontalIcon,
    DistributeVerticalIcon,
} from '@toeverything/components/icons';
import {
    IconButton,
    Popover,
    Tooltip,
    useTheme,
} from '@toeverything/components/ui';
import { AlignPanel } from '../align-panel';
interface BorderColorConfigProps {
    app: TldrawApp;
    shapes: TDShape[];
}

export enum AlignType {
    Top = 'top',
    CenterVertical = 'centerVertical',
    Bottom = 'bottom',
    Left = 'left',
    CenterHorizontal = 'centerHorizontal',
    Right = 'right',
}

let AlignPanelArr = [
    {
        name: 'top',
        title: 'Align top',
        icon: <AlignToTopIcon></AlignToTopIcon>,
    },
    {
        name: 'centerVertical',
        title: 'Align Center Vertical',
        icon: <AlignVerticalCenterIcon></AlignVerticalCenterIcon>,
    },
    {
        name: 'bottom',
        title: 'Align bottom',
        icon: <AlignToBottomIcon></AlignToBottomIcon>,
    },
    {
        name: 'left',
        title: 'Align left',
        icon: <AlignToLeftIcon></AlignToLeftIcon>,
    },
    {
        name: 'right',
        title: 'Align right',
        icon: <AlignToRightIcon></AlignToRightIcon>,
    },
    {
        name: 'centerHorizontal',
        title: 'Align centerHorizontal',
        icon: <AlignHorizontalCenterIcon></AlignHorizontalCenterIcon>,
    },
    {
        name: 'stretchCenterHorizontal',
        title: 'Align stretch centerHorizontal',
        icon: <DistributeHorizontalIcon></DistributeHorizontalIcon>,
    },
    {
        name: 'stretchCenterVertical',
        title: 'Align stretch centerHorizontal',
        icon: <DistributeVerticalIcon></DistributeVerticalIcon>,
    },
];
export const AlignOperation = ({ app, shapes }: BorderColorConfigProps) => {
    const theme = useTheme();
    const setAlign = (alginType: string) => {
        switch (alginType) {
            case 'stretchCenterHorizontal':
                app.stretch(StretchType.Horizontal);
                break;
            case 'stretchCenterVertical':
                app.stretch(StretchType.Vertical);
                break;
            default:
                app.align(alginType as AlignType);
                break;
        }
    };

    return (
        <Popover
            trigger="hover"
            placement="bottom-start"
            content={
                <AlignPanel
                    alignOptions={AlignPanelArr}
                    onSelect={setAlign}
                ></AlignPanel>
            }
        >
            <Tooltip content="Align" placement="top-start">
                <IconButton>
                    <AlignIcon />
                </IconButton>
            </Tooltip>
        </Popover>
    );
};
