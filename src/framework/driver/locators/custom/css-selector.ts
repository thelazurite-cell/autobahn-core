import { Selector } from 'testcafe';
import { State } from '../../../logging/state';
import { LogItem } from '../../../logging/log-item';
import { CssOptions } from './css-options';

const elementByCss: Selector = Selector((options: CssOptions) => {
    if (options.query == null) throw Error('was not expecting the selector value to be null');

    if (options.multiple == null) throw Error('was not expecting the selector target value to be null');

    const elements = document.querySelectorAll(options.query);
    if (elements.length > 1 && !options.multiple) {
        throw Error('found more than one element with selector');
    }

    if (elements.length === 1) {
        elements[0].scrollIntoView();
    }

    return elements;
});

const cssSelector = function (options: CssOptions): Selector {
    State.log(new LogItem(`CssSelector: ${options.query}, expects multiple elements ${options.multiple.toString()}`));
    return Selector(elementByCss(options));
};

cssSelector.prototype.toString = function () {
    return cssSelector.prototype.options.toString();
};

export default cssSelector;
