/* eslint-disable @typescript-eslint/prefer-for-of */
import { Selector } from 'testcafe';
import { State } from '../../../logging/state';
import { LogItem } from '../../../logging/log-item';
import { ByTypeOptions } from './by-type-options';

const elementByType: Selector = Selector((options: ByTypeOptions) => {
    let query = options.query;
    const elementName = options.elementType;
    const isFirst = options.selectorOptions.some((itm) => itm === 'First');
    const isLast = options.selectorOptions.some((itm) => itm === 'Last');
    const isExact = options.selectorOptions.some((itm) => itm === 'Exact');
    const isSingle = options.selectorOptions.some(itm => itm === 'Single');
    // if we're searching for exact strings we'll search for a match that is case sensitive and the string is equal.
    query = isExact ? query : query.toString().toLowerCase();
    if (query == null) {
        throw Error('was not expecting the query to be null');
    }

    const elementsByTagName = document.getElementsByTagName(elementName);
    const inputElements = document.getElementsByTagName('input');
    const filter = [];
    for (let i = 0; i < elementsByTagName.length; i++) {
        // We're working in javascript here; this will be sent to the browser client so we will not know the type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itm: any = elementsByTagName[i];
        if (!itm) {
            continue;
        }

        if (!itm.innerText) {
            continue;
        }

        if (isExact && itm.innerText === query) {
            filter.push(itm);
        } else if (itm.innerText.toString().toLowerCase().indexOf(query.toString().toLowerCase()) > -1) {
            filter.push(itm);
        }
    }

    for (let i = 0; i < inputElements.length; i++) {
        const itm = inputElements[i];
        if (!itm) continue;
        const currentValue = itm.getAttribute('value');
        if (!currentValue) continue;
        if (itm.getAttribute('type').toString().toLowerCase() === elementName.toString().toLowerCase()
            && currentValue.toString().toLowerCase().indexOf(query.toLowerCase()) > -1) {
            filter.push(itm);
        }
    }

    // if we were searching for one item; throw an error otherwise select the requested item(s)
    if (isSingle && filter.length > 0) {
        throw Error(`Expected a single item, got ${filter.length}`);
    } else if (isFirst) {
        return filter[0];
    } else if (isLast) {
        return filter[filter.length - 1];
    }

    return filter;
});

/***
 * Search for an element with the provided tag name and options.
 *
 * Modifiers:
 *   * Options.First - get the first match
 *   * Options.Last - get the last match
 *   * Options.Exact - get an exact match (innerText has to be exactly equal to the @Selector value
 *   * Options.Single - ensure we only get one match; if we don't throw an error.
 */
export default function (options: ByTypeOptions): Selector {
    State.log(new LogItem(`ElementNameSelector: ${options.query} with HTML type ${options.elementType} and options ${JSON.stringify(options.selectorOptions)} `));
    return Selector(elementByType(options));
}
