import { genErrorObj } from '@toeverything/utils';
import { createContext, PropsWithChildren, useContext } from 'react';
import { RenderBlockProps } from './RenderBlock';

type BlockRenderProps = {
    blockRender: (args: RenderBlockProps) => JSX.Element | null;
};

export const BlockRenderContext = createContext<BlockRenderProps>(
    genErrorObj(
        'Failed to get BlockChildrenContext! The context only can use under the "render-root"'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any
);

/**
 * CAUTION! DO NOT PROVIDE A DYNAMIC BLOCK RENDER!
 */
export const BlockRenderProvider = ({
    blockRender,
    children,
}: PropsWithChildren<BlockRenderProps>) => {
    return (
        <BlockRenderContext.Provider value={{ blockRender }}>
            {children}
        </BlockRenderContext.Provider>
    );
};

export const useBlockRender = () => {
    const { blockRender } = useContext(BlockRenderContext);
    return {
        BlockRender: blockRender,
    };
};
