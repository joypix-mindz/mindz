import {
    ArrowIcon,
    EllipseIcon,
    PolygonIcon,
    RectangleIcon,
    ShapeIcon,
    StarIcon,
    TriangleIcon,
} from '@toeverything/components/icons';
import {
    IconButton,
    Popover,
    styled,
    Tooltip,
} from '@toeverything/components/ui';
import { useEffect, useState } from 'react';

import { TldrawApp } from '@toeverything/components/board-state';
import { TDShapeType, TDSnapshot } from '@toeverything/components/board-types';

export type ShapeTypes =
    | TDShapeType.Rectangle
    | TDShapeType.Ellipse
    | TDShapeType.Triangle
    | TDShapeType.Line
    | TDShapeType.Hexagon
    | TDShapeType.Pentagram
    | TDShapeType.WhiteArrow
    | TDShapeType.Arrow;

const shapes = [
    {
        type: TDShapeType.Rectangle,
        label: 'Rectangle',
        tooltip: 'Rectangle',
        icon: RectangleIcon,
    },
    {
        type: TDShapeType.WhiteArrow,
        label: 'WhiteArrow',
        tooltip: 'WhiteArrow',
        icon: ArrowIcon,
    },
    {
        type: TDShapeType.Triangle,
        label: 'Triangle',
        tooltip: 'Triangle',
        icon: TriangleIcon,
    },
    {
        type: TDShapeType.Hexagon,
        label: 'InvertedTranslate',
        tooltip: 'InvertedTranslate',
        icon: PolygonIcon,
    },
    {
        type: TDShapeType.Pentagram,
        label: 'Pentagram',
        tooltip: 'Pentagram',
        icon: StarIcon,
    },
    {
        type: TDShapeType.Ellipse,
        label: 'Ellipse',
        tooltip: 'Ellipse',
        icon: EllipseIcon,
    },
] as const;

const activeToolSelector = (s: TDSnapshot) => s.appState.activeTool;

export const ShapeTools = ({ app }: { app: TldrawApp }) => {
    const activeTool = app.useStore(activeToolSelector);
    const [visible, setVisible] = useState(false);

    const [lastActiveTool, setLastActiveTool] = useState<ShapeTypes>(
        TDShapeType.Rectangle
    );

    useEffect(() => {
        if (
            shapes.find(s => s.type === activeTool) &&
            lastActiveTool !== activeTool
        ) {
            setLastActiveTool(activeTool as ShapeTypes);
        }
    }, [activeTool, lastActiveTool]);

    return (
        <Popover
            visible={visible}
            placement="right-start"
            onClick={() => setVisible(prev => !prev)}
            onClickAway={() => setVisible(false)}
            content={
                <ShapesContainer>
                    {shapes.map(({ type, label, tooltip, icon: Icon }) => (
                        <Tooltip content={tooltip} key={type} placement="right">
                            <IconButton
                                onClick={() => {
                                    app.selectTool(type);
                                    setVisible(false);
                                    setLastActiveTool(type);
                                }}
                            >
                                <Icon />
                            </IconButton>
                        </Tooltip>
                    ))}
                </ShapesContainer>
            }
        >
            <Tooltip content="Shapes" placement="right" trigger="hover">
                <IconButton aria-label="Shapes">
                    <ShapeIcon />
                </IconButton>
            </Tooltip>
        </Popover>
    );
};

const ShapesContainer = styled('div')({
    width: '64px',
    display: 'flex',
    flexWrap: 'wrap',
});
