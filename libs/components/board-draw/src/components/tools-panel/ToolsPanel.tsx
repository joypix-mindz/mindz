import {
    EraserIcon,
    EraserIconProps,
    FrameIcon,
    HandToolIcon,
    HandToolIconProps,
    SelectIcon,
    SelectIconProps,
    TextIcon,
    TextIconProps,
} from '@toeverything/components/icons';
import {
    IconButton,
    PopoverContainer,
    styled,
    // MuiIconButton as IconButton,
    // MuiTooltip as Tooltip,
    Tooltip,
    useTheme,
} from '@toeverything/components/ui';

import { TldrawApp } from '@toeverything/components/board-state';
import {
    TDShapeType,
    TDSnapshot,
    TDToolType,
} from '@toeverything/components/board-types';

import { ComponentType } from 'react';
import { LineTools } from './LineTools';
import { PenTools } from './pen-tools';
import { ShapeTools } from './ShapeTools';

const activeToolSelector = (s: TDSnapshot) => s.appState.activeTool;
const toolLockedSelector = (s: TDSnapshot) => s.appState.isToolLocked;

const tools: Array<{
    type: string;
    label?: string;
    tooltip?: string;
    icon?: ComponentType<
        SelectIconProps | EraserIconProps | HandToolIconProps | TextIconProps
    >;
    component?: ComponentType<{ app: TldrawApp }>;
}> = [
    {
        type: 'select',
        label: 'Select',
        tooltip: 'Select',
        icon: SelectIcon,
    },
    { type: 'frame', label: 'Frame', tooltip: 'Frame', icon: FrameIcon },
    {
        type: TDShapeType.Editor,
        label: 'Text Block',
        tooltip: 'Text Block',
        icon: TextIcon,
    },
    { type: 'shapes', component: ShapeTools },
    { type: 'draw', component: PenTools },
    { type: 'Connector', component: LineTools },
    // { type: 'erase', label: 'Erase', tooltip: 'Erase', icon: EraseIcon },
    {
        type: TDShapeType.HandDrag,
        label: 'Hand Drag',
        tooltip: 'Hand Drag',
        icon: HandToolIcon,
    },
    {
        type: 'erase',
        label: 'Eraser',
        tooltip: 'Eraser',
        icon: EraserIcon,
    },
];

export const ToolsPanel = ({ app }: { app: TldrawApp }) => {
    const activeTool = app.useStore(activeToolSelector);

    const isToolLocked = app.useStore(toolLockedSelector);
    const theme = useTheme();

    return (
        <PopoverContainer
            style={{
                position: 'absolute',
                left: '10px',
                top: '40%',
                transform: 'translateY(-50%)',
            }}
            direction="none"
        >
            <Container>
                <ToolBar>
                    {tools.map(
                        ({
                            type,
                            label,
                            tooltip,
                            icon: Icon,
                            component: Component,
                        }) =>
                            Component ? (
                                <Component key={type} app={app} />
                            ) : (
                                <Tooltip
                                    content={tooltip}
                                    key={type}
                                    placement="right"
                                >
                                    <IconButton
                                        aria-label={label}
                                        style={{
                                            color:
                                                activeTool === type
                                                    ? theme.affine.palette
                                                          .primary
                                                    : '',
                                        }}
                                        onClick={() => {
                                            app.selectTool(type as TDToolType);
                                        }}
                                        disabled={isToolLocked}
                                    >
                                        <Icon />
                                    </IconButton>
                                </Tooltip>
                            )
                    )}
                </ToolBar>
            </Container>
        </PopoverContainer>
    );
};

const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
});
const ToolBar = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '4px 4px',
});
