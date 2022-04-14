import { Selector } from 'testcafe';
import { NameOptions } from './name-options';

const byName: Selector = Selector((options: NameOptions) => {
    return document.getElementsByName(options.name);
});

const nameSelector = function (options: NameOptions): Selector {
    return Selector(byName(options));
};

export default nameSelector;