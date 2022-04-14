/// <reference path="../index.ts"/>
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DataTable } from '@cucumber/cucumber';
import { GherkinProcessor } from './gherkin-processor';
import { messages } from '@cucumber/messages';
import { getMatches } from './helper-functions';
import { FilterOptions } from './models/filter-options';
import { injectable } from 'inversify';
import { GlobReader } from './glob-reader';
import { ConsoleColor, symbols } from '../../helpers/console-color.enum';
import { TestLockManager } from '../../driver/test-lock-manager';
import { LockState } from '../../driver/lock-state';

@injectable()
export class GherkinExecutor {
    protected readonly gherkinBehavior: GherkinProcessor;
    protected stepFiles: string[] = [];
    protected specFiles: string[] = [];
    protected tags: (string | string[])[] = [];
    protected filterOptions: FilterOptions;

    constructor(sources: string[]) {
        sources = GlobReader.getTestFiles(sources);
        this.stepFiles = sources.filter(source => source.endsWith('.js') || source.endsWith('.ts'));
        this.specFiles = sources.filter(source => source.endsWith('.feature'));
        this.gherkinBehavior = new GherkinProcessor(this.specFiles, this.stepFiles);
        this.tags = this.gherkinBehavior.getTags();
    }

    // disable unused vars; this method should be overridden by other classes implementing this.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected runStep(step: Func, parameters: string[], table: DataTable = null, ...params: ExecutorSpecificParams): Promise<void> {
        return Promise.resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async runHooks(hooks: Hook[], ...params: ExecutorSpecificParams): Promise<void> {
        for (const hook of hooks) {
            await this.runStep(hook.code, [], null, ...params);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async runFeatureHooks(hooks: Hook[], ...params: ExecutorSpecificParams): Promise<void> {
        for (const hook of hooks) {
            await hook.code(...params);
        }
    }

    public async resolveAndRunStepDefinition(step: messages.Pickle.PickleStep, ...params: ExecutorSpecificParams): Promise<void> {
        for (const stepDefinition of this.gherkinBehavior.stepDefinitions) {
            const [isMatched, parameters, table] = this.gherkinBehavior.shouldRunStep(stepDefinition, step);
            if (isMatched) {
                return this.runStep(stepDefinition.code, <string[]><unknown>parameters, <DataTable><unknown>table, ...params);
            }
        }

        throw Error(`Step implementation missing for: ${step.text} `);
    }

    public getIncludingTags(tags: Tag[]): Tag[] {
        return tags.filter(tag => (Array.isArray(tag) ? true : !tag.startsWith('~')));
    }

    public getExcludingTags(tags: Tag[]): Tag[] {
        return tags
            .filter(tag => (Array.isArray(tag) ? false : tag.startsWith('~')))
            .map(tag => (!Array.isArray(tag) && tag.startsWith('~') ? tag.slice(1) : tag));
    }

    public scenarioHasAnyOfTheTags(scenario: messages.Pickle, tags: Tag[]): boolean {
        const scenarioTagsList = scenario.tags.map((tag) => tag.name);

        return (
            !tags.length ||
            tags.some((tag) => {
                return Array.isArray(tag) ? this.scenarioHasAllOfTheTags(scenario, tag) : scenarioTagsList.includes(tag);
            })
        );
    }

    public scenarioLacksTags(scenario: messages.Pickle, tags: Tag[]): boolean {
        return !tags.length || !this.scenarioHasAnyOfTheTags(scenario, tags);
    }

    public scenarioHasAllOfTheTags(scenario: messages.Pickle, tags: Tag[]): boolean {
        const scenarioTagsList = scenario.tags.map((tag) => tag.name);

        return tags.every(
            (tag: string) => tag.startsWith('~')
                ? !scenarioTagsList.includes(tag.slice(1))
                : scenarioTagsList.includes(tag)
        );
    }

    public shouldRunScenario(scenario: messages.Pickle): boolean {
        return (
            this.scenarioHasAnyOfTheTags(scenario, this.getIncludingTags(this.tags)) &&
            this.scenarioLacksTags(scenario, this.getExcludingTags(this.tags))
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected filter: (testName: string, fixtureName: string, filePath: string) => boolean = (testName: string, fixtureName: string, _filePath: string) => {
        let matches = true;

        if (this.filterOptions.testName) {
            const found = getMatches(testName, this.filterOptions.testName);
            matches = matches && found.length > 0;
        }

        if (this.filterOptions.fixtureName) {
            const found = getMatches(fixtureName, this.filterOptions.fixtureName);
            matches = matches && found.length > 0;
        }

        return matches;
    };

    protected async runScenario(scenario: messages.Pickle, error: Error, lockState: LockState, ...params: ExecutorSpecificParams): Promise<Error> {
        try {
            for (const step of scenario.steps) {
                await TestLockManager.waitForTurn(lockState);

                await this.resolveAndRunStepDefinition(<messages.Pickle.PickleStep>step, ...params).catch(reason => error = reason);
                if (error) {
                    console.log(`${ConsoleColor.FgRed}\t${symbols.err} ${scenario.name} - ${step.text} ${ConsoleColor.Reset}`);
                    break;
                } else {
                    console.log(`${ConsoleColor.FgGreen}\t${symbols.ok} ${scenario.name} - ${step.text} ${ConsoleColor.Reset}`);
                }
            }
        } catch (e) {
            error = e;
        }

        return error;
    }
}
