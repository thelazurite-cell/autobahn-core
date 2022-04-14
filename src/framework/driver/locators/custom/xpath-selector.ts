import { Selector } from 'testcafe';
import { State } from '../../../logging/state';
import { LogItem } from '../../../logging/log-item';
import { Level } from '../../../logging/level';
import { XpathOptions } from './xpath-options';

const elementByXPath: Selector = Selector((options: XpathOptions) => {
    const iterator = document.evaluate(options.query, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    const items = [];

    let item = iterator.iterateNext();
    while (item) {
        if (items.length > 1 && !options.all) {
            throw Error(`Expected a single item, got ${items.length}`);
        }

        items.push(item);
        item = iterator.iterateNext();
    }

    return items;
});

export default function (options: XpathOptions): Selector {
    State.log(new LogItem(`XpathSelector: ${options.query}, expects multiple elements: ${options.query}`, Level.Info));
    return Selector(elementByXPath(options));
}
