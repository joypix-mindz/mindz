import {
    AsyncBlock,
    BaseView,
    SelectBlock,
} from '@toeverything/framework/virgo';
import { Protocol } from '@toeverything/datasource/db-service';
import { YoutubeView } from './YoutubeView';

export class YoutubeBlock extends BaseView {
    public override selectable = true;
    public override activatable = false;
    type = Protocol.Block.Type.youtube;
    View = YoutubeView;

    override html2block(
        el: Element,
        parseEl: (el: Element) => any[]
    ): any[] | null {
        const tag_name = el.tagName;
        if (tag_name === 'A' && el.parentElement?.childElementCount === 1) {
            const href = el.getAttribute('href');
            if (href.indexOf('.youtube.com') !== -1) {
                return [
                    {
                        type: this.type,
                        properties: {
                            // TODO: is not sure what value to fill in name
                            embedLink: {
                                name: this.type,
                                value: el.getAttribute('href'),
                            },
                        },
                        children: [],
                    },
                ];
            }
        }

        return null;
    }

    override async block2html(
        block: AsyncBlock,
        children: SelectBlock[],
        generateHtml: (el: any[]) => Promise<string>
    ): Promise<string> {
        const url = block.getProperty('embedLink')?.value;
        return `<p><a src=${url}>${url}</p>`;
    }
}
