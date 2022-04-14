/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DataTable, supportCodeLibraryBuilder } from '@cucumber/cucumber';
import { CucumberExpression, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';
import { ConsoleColor } from '../../helpers/console-color.enum';
import { IdGenerator } from '@cucumber/messages';
import { GherkinTestCafeCompiler } from '../testcafe/gherkin-testcafe-compiler';
import { IGherkinCompiler } from './gherkin-compiler.interface';
import { ISupportCodeLibrary } from '@cucumber/cucumber/lib/support_code_library_builder/types';
import { messages } from '@cucumber/messages';
import { TestFile } from './models/test-file';
import { SpecReadError } from './models/spec-read-error';
import { Attachment } from './models/attachment';
import { InvalidStepError } from './models/invalid-step-error';
import { Feature } from './models/feature';
import { Spec } from './models/spec';
import gherkin from 'gherkin';
import internal from 'stream';
import StepDefinition from '@cucumber/cucumber/lib/models/step_definition';
import TestCaseHookDefinition from '@cucumber/cucumber/lib/models/test_case_hook_definition';
import TestRunHookDefinition from '@cucumber/cucumber/lib/models/test_run_hook_definition';

export class GherkinProcessor {
    public readonly compiler: IGherkinCompiler;
    private readonly parameterRegistryArg: string = '--param-type-registry-file';
    private readonly andSeparator = ' and '

    private readonly parameterRegistry: ParameterTypeRegistry;
    public stepDefinitions: StepDefinition[] = [];

    public beforeHooks: TestCaseHookDefinition[] = [];
    public afterHooks: TestCaseHookDefinition[] = [];

    public beforeAllHooks: TestRunHookDefinition[] = [];
    public afterAllHooks: TestRunHookDefinition[] = [];

    specFiles: string[];
    stepFiles: string[];

    constructor(specs: string[], steps: string[], compiler: IGherkinCompiler = new GherkinTestCafeCompiler()) {
        this.parameterRegistry = this.getParameterTypeRegistry();
        this.specFiles = specs;
        this.stepFiles = steps;
        this.compiler = compiler;
    }

    public getTags(): Tag[] {
        const tagsIndex = process.argv.findIndex(val => val === '--tags');
        if (tagsIndex !== -1) {
            return process.argv[tagsIndex + 1]
                .split(',')
                .map(tag => (tag.includes(this.andSeparator) ? tag.split(this.andSeparator) : tag));
        }

        return [];
    }

    public getParameterTypeRegistry(): ParameterTypeRegistry {
        const argumentIndex = process.argv.findIndex(val => val === this.parameterRegistryArg);
        if (argumentIndex !== -1) {
            const assumedFilePath = process.argv[argumentIndex + 1];
            const absolouteFilePath = require.resolve(assumedFilePath, { paths: [process.cwd()] });
            return require(absolouteFilePath);
        }

        return new ParameterTypeRegistry();
    }

    public getCucumberDataTable(step: Step): DataTable {
        if ((<messages.Pickle.PickleStep><unknown>step).argument && (<messages.Pickle.PickleStep><unknown>step).argument.dataTable) {
            return new DataTable((<messages.Pickle.PickleStep><unknown>step).argument.dataTable);
        }
        else if ((<messages.GherkinDocument.Feature.Step>step).dataTable) {
            return new DataTable((<messages.GherkinDocument.Feature.Step>step).dataTable);
        }

        return null;
    }

    public async streamToArray(fromPaths: internal.Readable): Promise<messages.Envelope[]> {
        return new Promise((resolve, reject) => {
            const items: messages.Envelope[] = [];
            fromPaths.on('data', items.push.bind(items));
            fromPaths.on('error', reject);
            fromPaths.on('end', () => resolve(items));
        });
    }

    public async loadSpec(specFile: string): Promise<Spec> {
        if (!specFile) return;
        const gherkinResult = await this.streamToArray(gherkin.fromPaths([specFile]));
        const testFile = new TestFile();
        testFile.fileName = specFile;
        const { gherkinDocument } = gherkinResult[1];

        if (!gherkinDocument) {
            this.throwReadError(`Failed to read feature file ${specFile}.`, gherkinResult);
        }

        const spec = new Spec();
        spec.testFile = testFile;
        spec.gherkinResult = gherkinResult;
        spec.gherkinDocument = gherkinDocument;
        return spec;
    }

    public throwReadError(message: string, gherkinResult: unknown[]): never {
        const err = new SpecReadError(message);
        err.attachments = [...gherkinResult.filter(({ attachment }) => Boolean(attachment)).map(({ attachment }) => <Attachment><unknown>attachment)];
        throw err;
    }

    // Step must be of any type. 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public findStepDefinition(step: any): boolean {
        for (const stepDefinition of this.stepDefinitions) {
            const [isMatched] = this.shouldRunStep(stepDefinition, step);
            if (isMatched) { return true; }
        }

        return false;
    }

    // Step must be of any type. 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public shouldRunStep(stepDefinition: StepDefinition, step: any): StepRunnableResult[] {
        if (typeof stepDefinition.pattern === 'string') {
            const cucumberExpression = new CucumberExpression(stepDefinition.pattern, this.parameterRegistry);
            const matchResult = cucumberExpression.match(step.text);
            if (matchResult) {
                return [true, matchResult.map((result) => result.getValue(result)), this.getCucumberDataTable(step)];
            }

            return [false, [], this.getCucumberDataTable(step)];
        } else if (stepDefinition.pattern instanceof RegExp) {
            const match = stepDefinition.pattern.exec(step.text);
            return [Boolean(match), match ? match.slice(1) : [], this.getCucumberDataTable(step)];
        }

        const stepType: string = step.text instanceof Object ? step.text.constructor.name : typeof step.text;
        const err = new InvalidStepError(`Step implementation invalid. Has to be a String or RegExp. Recieved ${stepType}`);
        err.stepDefinition = stepDefinition;
        err.step = step;

        throw err;
    }

    public processFeature(specFile: Spec): Feature {
        const feature = new Feature();
        feature.featureTitle = `Feature: ${specFile.gherkinDocument.feature.name}`;
        feature.fileName = specFile.testFile.fileName;
        specFile.gherkinResult.forEach(({ pickle: scenario }) => {
            if (scenario) {
                if (scenario.steps && scenario.steps.length !== 0) {
                    scenario.steps.forEach((step: messages.Pickle.IPickleStep) => {
                        if (feature.featureSteps.every(stepText => stepText !== step.text)) {
                            feature.featureSteps.push(step);
                        }
                    });
                } else {
                    console.warn(`There are no steps for ${feature.featureTitle}`);
                }
            }
        });

        feature.missingFeatureSteps = feature.featureSteps.filter(step => !this.findStepDefinition(step)).map(step => step.text);

        return feature;
    }

    public async processAllFeatures(): Promise<Feature[]> {
        return await Promise.all(
            this.specFiles.map(async specFile => {
                const spec = await this.loadSpec(specFile);
                return this.processFeature(spec);
            })
        );
    }

    public async reportMissingSteps(featureStepsArray: Feature[]): Promise<void> {
        featureStepsArray.map((feature) => {
            console.log(`\n\t${feature.featureTitle}`);
            console.log(`\t\tSteps: ${`${feature.featureSteps.length - feature.missingFeatureSteps.length}/${feature.featureSteps.length}`}`);

            if (feature.missingFeatureSteps.length) {
                const missing = feature.missingFeatureSteps.reduce((acc, cur) => `${acc}\n        ${cur}`, '');
                console.error(
                    `\t\t\t${ConsoleColor.FgRed}Missing steps: ${missing} ${ConsoleColor.Reset}`
                );
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public findHook(scenario: messages.GherkinDocument.Feature.Scenario | messages.IPickle, hooks: Hook[]): Hook[] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return hooks.filter((hook: Hook) => !hook.options.tags || (<messages.IPickle><unknown>scenario).tags.find((tag: messages.Pickle.IPickleTag) => tag.name === hook.options.tags));
    }

    public async loadStepDefinitions(...params: CompilerArray): Promise<void> {
        supportCodeLibraryBuilder.reset(process.cwd(), IdGenerator.uuid());
        // console.log('attempting to load step definitions');

        await this.compiler.compileStepDefinitions(this.stepFiles, ...params);

        //HACK: overwritting a private field? Is there no other way of doing this? 
        // eslint-disable-next-line @typescript-eslint/dot-notation
        supportCodeLibraryBuilder['parameterTypeRegistry'] = this.parameterRegistry;
        this.setStepDefinitions(supportCodeLibraryBuilder.finalize());
    }

    private setStepDefinitions(finalizedStepDefinitions: ISupportCodeLibrary): void {
        this.afterHooks = finalizedStepDefinitions.afterTestCaseHookDefinitions;
        this.afterAllHooks = finalizedStepDefinitions.afterTestRunHookDefinitions;
        this.beforeHooks = finalizedStepDefinitions.beforeTestCaseHookDefinitions;
        this.beforeAllHooks = finalizedStepDefinitions.beforeTestRunHookDefinitions;
        this.stepDefinitions = finalizedStepDefinitions.stepDefinitions;
    }
}