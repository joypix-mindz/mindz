const Protocol = {
    Block: {
        Type: {
            workspace: 'workspace',
            page: 'page',
            group: 'group',
            title: 'title',
            text: 'text',
            heading1: 'heading1',
            heading2: 'heading2',
            heading3: 'heading3',
            code: 'code',
            todo: 'todo',
            comments: 'comments',
            tag: 'tag',
            reference: 'reference',
            image: 'image',
            file: 'file',
            audio: 'audio',
            video: 'video',
            shape: 'shape',
            quote: 'quote',
            toc: 'toc',
            database: 'database',
            whiteboard: 'whiteboard',
            template: 'template',
            discussion: 'discussion',
            comment: 'comment',
            activity: 'activity',
            bullet: 'bullet',
            numbered: 'numbered',
            toggle: 'toggle',
            callout: 'callout',
            divider: 'divider',
            groupDivider: 'groupDivider',
            youtube: 'youtube',
            figma: 'figma',
            embedLink: 'embedLink',
            grid: 'grid',
            gridItem: 'gridItem',
        },
    },
} as const;

export { Protocol };
