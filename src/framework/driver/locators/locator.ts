/*
 * locator.ts

 */
import { LocatorType } from './locator-type';
import { Selector } from 'testcafe';
import { Options } from '../options';
import CssSelector from './custom/css-selector';
import XpathSelector from './custom/xpath-selector';
import { XpathOptions } from './custom/xpath-options';
import { Configuration } from '../../configuration/configuration';
import ByTypeSelector from './custom/by-type-selector';
import { State } from '../../logging/state';
import { LogItem } from '../../logging/log-item';
import { Level } from '../../logging/level';
import { CssOptions } from './custom/css-options';
import { ByTypeOptions } from './custom/by-type-options';
import NameSelector from './custom/name-selector';
import { NameOptions } from './custom/name-options';

export const linkElement: string = 'a';
export const buttonElement: string = 'button';

/**
 * the @typedef Locator class. This class should be used to build a testcafe selector by providing 
 * a query value, @typedef LocatorType and the required @typedef Options
 */
export class Locator {
    /**
     * The query/selector value that should be used by the locator.
     */
    public selector: string;

    /**
     * The Type of locator to be generated.
     */
    public type: LocatorType;

    /**
     * Options to be used by the locator.
     */
    public options: Options[] = [];

    public types: Map<LocatorType, (t: TestController, custom?: number) => Selector> = new Map([
        [LocatorType.Css, (t, custom) => CssSelector(new CssOptions(this.selector, false)).with(this.getOptions(t, custom))],
        [LocatorType.AllCss, (t, custom) => CssSelector(new CssOptions(this.selector, true)).with(this.getOptions(t, custom))],
        [LocatorType.Link, (t, custom?) => ByTypeSelector(new ByTypeOptions(linkElement, this.selector, this.options)).with(this.getOptions(t, custom))],
        [LocatorType.Button, (t, custom?) => ByTypeSelector(new ByTypeOptions(buttonElement, this.selector, this.options)).with(this.getOptions(t, custom))],
        [LocatorType.Id, (t, custom?) => this.defaultSelector(t, custom, true)],
        [LocatorType.XPath, (t, custom?) => XpathSelector(new XpathOptions(this.selector, false)).with(this.getOptions(t, custom))],
        [LocatorType.AllXPath, (t, custom?) => XpathSelector(new XpathOptions(this.selector, true)).with(this.getOptions(t, custom))],
        [LocatorType.Name, (t, custom?) => NameSelector(new NameOptions(this.selector)).with(this.getOptions(t, custom))],
        [LocatorType.Fallback, (t, custom?) => this.defaultSelector(t, custom)]
    ]);

    /***
     * Creates a locator object with the provided parameters
     * @param selector the query value to use for the locator
     * @param type the type of locator you want to use, defaults to ID
     * @param options the options to use, passed through as an array of @typedef Options, defaults to none.
     * 
     * @returns the new locator instance 
     */
    constructor(selector: string, type: LocatorType = LocatorType.Id, options: Options[] = []) {
        this.selector = selector;
        this.type = type;
        this.options = options;
    }

    private defaultSelector(t: TestController, custom: number, id: boolean = false): Selector {
        const selector = id ? `#${this.selector}` : this.selector;
        State.log(new LogItem(`Selector: ${selector} with timeout: ${this.defaultTimeout}`, Level.Info));
        return Selector(selector).with(this.getOptions(t, custom));
    }

    public get(t: TestController = null, timeout?: number): Selector {
        try {
            if (this.types.has(this.type)) {
                return this.types.get(this.type)(t, timeout);
            }

            throw new Error('Selector could not be found');
        } catch (e) {
            State.log(new LogItem(`Couldn't create an instance of the requested selector ${this.type.toString()}`, Level.Error));
            throw e;
        }
    }

    public getOptions(t: TestController = null, custom?: number): unknown {
        return {
            boundTestRun: !t ? State.scope : t,
            timeout: custom ? custom : this.defaultTimeout,
            visibilityCheck: !this.options.includes(Options.AllowInvisible)
        };
    }

    private get defaultTimeout() {
        return this.options.includes(Options.NoWait) ? 1000 : Configuration.application.frameworkConfig.defaultElementTimeoutMs;
    }
}

export function $(selector: string, type: LocatorType = LocatorType.Id, options: Options[] = []): Locator {
    return new Locator(selector, type, options || []);
}