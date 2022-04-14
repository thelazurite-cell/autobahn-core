import { State } from '../logging/state';
import { LogItem } from '../logging/log-item';
import { Level } from '../logging/level';
import { ClientFunction, Selector } from 'testcafe';
import { Timespan } from '../timespan/timespan';
import { Configuration } from '../configuration/configuration';
import { Locator } from './locators/locator';
import { writeFileSync } from 'fs';
import { injectable } from 'inversify';
import { expect } from 'chai';
import path from 'path';

@injectable()
export class PageObjectModel {
    private static _url = `${Configuration.application.testHost}${Configuration.application.applicationRoot}`;
    public modelLocation = '/';
    public pageTitle: Selector = Selector('title').with({ timeout: Configuration.application.frameworkConfig.pageLoadTimeoutMs });
    public attempts: number = 0;

    static getApplicationUrl(): string {
        return PageObjectModel._url;
    }

    public static async goTo(t: TestController, url: string, _timeout: number = null): Promise<void> {
        return await t
            //.setPageLoadTimeout(timeout !== null ? timeout : Configuration.application.frameworkConfig.pageLoadTimeoutMs)
            .navigateTo(url);
    }

    public async currentUrl(): Promise<string> {
        const url = await (ClientFunction(() => window.location.href))();
        return Promise.resolve(url.toString());
    }

    public getPomUrl(): string {
        let pageUrl = `${PageObjectModel._url}${this.modelLocation}`;
        pageUrl = pageUrl.replace(/\/\//g, '/');
        return `${Configuration.application.ssl ? 'https' : 'http'}://${pageUrl}`;
    }

    public async waitFor(t: TestController, timeSpan: Timespan): Promise<void> {
        State.log(new LogItem(`Waiting for ${timeSpan.toString()}`, Level.Info));
        return await t.wait(timeSpan.toMs()).then(() => {
            State.log(new LogItem('Waiting complete', Level.Info));
            return Promise.resolve();
        });
    }

    public async onPage(t: TestController): Promise<void> {
        await t.expect(await this.currentUrl()).contains(this.getPomUrl(),
            { timeout: Configuration.application.frameworkConfig.pageLoadTimeoutMs });
    }

    public async fillInField<K extends keyof this>(t: TestController, locator: K | Locator, value: string, clearValue: boolean = true): Promise<void> {
        const empty = value.trim() === '';
        if (empty || clearValue) {
            await t
                .click((this.getLocatorDef(locator)).get(t))
                .pressKey('ctrl+a delete');
        }

        if (empty) return Promise.resolve();
        return await t.typeText(this.getLocatorDef(locator).get(t), value).pressKey('tab');
    }

    public async withinIframe<K extends keyof this>(i: TestController, locator: K | Locator, code: () => Promise<void>): Promise<void> {
        let error: Error;

        const iframe = this.getLocatorDef(locator).get(i, Configuration.application.frameworkConfig.pageLoadTimeoutMs);

        await i.switchToIframe(iframe);
        try {
            await code().catch(res => error = res);
        } catch (e) {
            error = e;
        }

        await i.switchToMainWindow();

        if (error) {
            throw error;
        }
    }

    private getLocatorDef<K extends keyof this>(locator: Locator | K) {
        return locator instanceof Locator ? locator : this[locator] as unknown as Locator;
    }

    public async setCheckbox<K extends keyof this>(t: TestController, locator: Locator | K, value: boolean) {
        const selector = this.getLocatorDef(locator).get(t).nth(0);

        await t.click(selector);

        const checkboxValue = await selector.value;

        if (value) {
            if (checkboxValue.toLowerCase() === 'false') {
                await t.click(selector);
            }
        } else {
            if (checkboxValue.toLowerCase() === 'true') {
                await t.click(selector);
            }
        }
    }

    public async selectOption<K extends keyof this>(t: TestController, locator: Locator | K, value: string, exact: boolean = false): Promise<void> {
        const selector = this.getLocatorDef(locator).get(t).nth(0);

        return await t.click(selector)
            .click(
                exact
                    ? selector.find('option')
                        .withExactText(value)
                    : selector.find('option')
                        .withText(value)
            );
    }

    public async uploadFile<K extends keyof this>(t: TestController, locator: Locator | K, type: string, sizeInMb: number): Promise<void> {
        const fileName = path.resolve(`./Reports/tmp-${type}`);
        writeFileSync(fileName, Buffer.alloc(1024 * 1024 * sizeInMb), { encoding: 'utf8' });
        return await t.setFilesToUpload(this.getLocatorDef(locator).get(t), fileName);
    }

    public async uploadRealFile<K extends keyof this>(t: TestController, locator: Locator | K, filePath: string): Promise<void> {
        const fileName = path.resolve(filePath);
        return await t.setFilesToUpload(this.getLocatorDef(locator).get(t), fileName);
    }

    public async hasClass<K extends keyof this>(t: TestController, locator: Locator | K, value: string): Promise<boolean> {
        const selector = this.getLocatorDef(locator).get(t);
        return await selector.hasClass(value);
    }

    public async attemptWithRetries<T>(name: string, maxAttempts: number, callback: () => Promise<T>): Promise<void | unknown> {
        let attemptValue = null;
        for (this.attempts = 0; this.attempts < maxAttempts; this.attempts++) {
            State.log(new LogItem(`Attempt #${this.attempts + 1} - ${name}`));
            await callback().then(result => attemptValue = result).catch(reason => State.log(new LogItem(reason, Level.Debug)));
            if (attemptValue) {
                return Promise.resolve(attemptValue);
            }
        }

        return Promise.reject(`Failed after a max of ${maxAttempts} attempts`);
    }

    async assertNumbersAreSorted(sortedColumn: Selector): Promise<void> {
        const results: number[] = [];

        for (let currentElement = 0; currentElement < await sortedColumn.count; currentElement++) {
            const item = sortedColumn.nth(currentElement);
            results.push(Number(await item.textContent));
        }

        this.sortShouldBeAscendingNumber(results);
    }

    async assertItemsAreSorted(sortedColumn: Selector): Promise<void> {
        const results: string[] = [];

        for (let currentElement = 0; currentElement < await sortedColumn.count; currentElement++) {
            const item = sortedColumn.nth(currentElement);
            results.push((await item.textContent).toLowerCase());
        }

        this.sortShouldBeAscending(results);
    }

    sortShouldBeAscending(results: string[]): void {
        const expected: string[] = JSON.parse(JSON.stringify(results));

        expected.sort((a: string, b: string) => {
            return (a > b) ? 1 : -1;
        });

        for (let item = 0; item < expected.length; item++) {
            const expectedItem = expected[item];
            const actualItem = results[item];

            expect(this.compareIgnoringSpace(expectedItem, actualItem))
                .to.eql(true, `expected the array to be sorted, ${expectedItem} to equal ${actualItem}`);
        }
    }

    sortShouldBeAscendingNumber(results: number[]): void {
        for (let itemIndex = 0; itemIndex < results.length; itemIndex++) {
            const current = results[itemIndex];
            const nextItemIndex = itemIndex + 1;

            if (nextItemIndex != results.length) {
                const next = results[nextItemIndex];

                expect(current).gte(next);
            }
        }
    }

    public compareIgnoringSpace(a: string, b: string): boolean {
        if (a.length === b.length) {
            for (let i = 0; i < a.length; i++) {
                if (a[i] === ' ' || b[i] === ' ') {
                    continue;
                }

                if (a[i] !== b[i])
                    return false;
            }
        } else {
            return false;
        }

        return true;
    }
}

