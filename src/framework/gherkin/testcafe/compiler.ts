/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { State } from '../../logging/state';
import { LogItem } from '../../logging/log-item';
import { Level } from '../../logging/level';
import { ConsoleColor } from '../../helpers/console-color.enum';
import { ClientFunction } from 'testcafe';
import { GenerationOptions } from '../support/models/generation-options';
import { GeneralError } from 'testcafe/lib/errors/runtime';
import { RUNTIME_ERRORS } from 'testcafe/lib/errors/types';
import DataTable from '@cucumber/cucumber/lib/models/data_table';
import Fixture from 'testcafe/lib/api/structure/fixture';
import Test from 'testcafe/lib/api/structure/test';
import testRunTracker from 'testcafe/lib/api/test-run-tracker';
import TestcafeESNextCompiler from 'testcafe/lib/compiler/test-file/formats/es-next/compiler';
import TestcafeTypescriptCompiler from 'testcafe/lib/compiler/test-file/formats/typescript/compiler';
import CustomizableCompilers from 'testcafe/lib/configuration/customizable-compilers';
import moment from 'moment';
import { messages } from '@cucumber/messages';
import { EnumHelper } from '../../helpers/enum-helper';
import { TestRunErrors } from './error-type.enum';
import { GherkinExecutor } from '../support/gherkin-executor';
import { Spec } from '../support/models/spec';
import { Configuration } from '../../configuration/configuration';
import { TestConfigurationItem } from '../../configuration/test-configuration-item';
import { allowRetryTag, getGenerateOptions, getTestFilter } from '../support/helper-functions';
import { LockState } from '../../driver/lock-state';
import { TestLockManager } from '../../driver/test-lock-manager';
import { Project } from '../../generator/model/project';
import { RequestMock } from 'testcafe';
import { readFileSync } from 'fs';
import { join } from 'path';

export type CompilerOptions = {
    [x: string]: Record<string, string>;
};

export type CallSite = {
    filename: string;
    lineNum: number;
    stackFrames: Record<string, string>[];
    callsiteFrameIdx: string | number;
};

export type TestCafeError = {
    errMsg: string;
    isTestCafeError: boolean;
    code: string;
    callsite: CallSite;
};

module.exports = class TypedTestCafeCompiler extends GherkinExecutor {
    externalCompilers: Compiler[];
    project: Project = new Project();

    private readonly generationOptions: GenerationOptions = new GenerationOptions();

    constructor(sources: string[], compilerOptions: CompilerOptions) {
        super(sources);

        this.filterOptions = getTestFilter();
        this.externalCompilers = [
            new TestcafeESNextCompiler(),
            new TestcafeTypescriptCompiler(compilerOptions[CustomizableCompilers.typescript])
        ];

        this.generationOptions = getGenerateOptions();
    }


    public static FetchOptions() {
        let fc = readFileSync('./tsconfig.json', { encoding: 'utf-8' });
        const spl = fc.split('\n');
        const isComment = /^(([ \t])+[/])+.+/gm;
        const temp = [];
        for (let i = 0; i < spl.length; i++) {
            if (!spl[i].match(isComment) && spl[i].trim().length > 0) {
                temp.push(spl[i]);
            }
        }

        fc = temp.join('\n');
        return JSON.parse(fc);
    }

    private static logStepError(currentStep, e) {
        State.log(
            new LogItem(
                `couldn't run the ${currentStep ? 'step definition for \'' + currentStep.text + '\'' : 'current step'}`,
                Level.Error));

        State.log(new LogItem(e, Level.Error));
    }

    async _dryRun() {
        await this.gherkinBehavior.reportMissingSteps(await this.gherkinBehavior.processAllFeatures());
    }

    public static getSupportedTestFileExtensions() {
        return ['.js', '.ts', '.feature'];
    }

    public init() {
        return this;
    }

    protected runStep(step: Func, parameters: string[], table: DataTable = null, testController: Test) {
        State.scope = testController;
        const markedFn = testRunTracker.addTrackingMarkerToFunction(testController.testRun.id, step);

        testRunTracker.ensureEnabled();

        return markedFn(testController, parameters, table);
    }

    // noinspection JSUnusedGlobalSymbols - called at runtime instead of the default testcafe compiler.
    async getTests() {
        await this.gherkinBehavior.loadStepDefinitions(this.externalCompilers);
        return await this.getGherkinTests();
    }

    private async getGherkinTests() {

        const projectText = JSON.parse(readFileSync(join(process.cwd(), 'config', 'project.json'), { encoding: 'utf8' }));
        Object.assign(this.project, projectText);

        let tests = await Promise.all(
            this.specFiles.map(async (specFile) => {
                const spec = await this.gherkinBehavior.loadSpec(specFile);
                return this.fetchTests(spec, this.project);
            })
        );

        tests = tests.reduce((agg, cur) => agg.concat(cur));

        if (this.filterOptions) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tests = tests.filter((test: any) => this.filter(test.name, test.fixture.name, test.fixture.path));
        }

        if (!tests.length) {
            throw new GeneralError(RUNTIME_ERRORS.noTestsToRun);
        }

        return tests;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private fetchTests(spec: Spec, project: Project) {
        if (!spec.gherkinDocument) {
            this.gherkinBehavior.throwReadError(`Failed to parse feature file ${spec.testFile.fileName}`, spec.gherkinResult);
        }

        const fixtureDetails = { filename: spec.testFile.fileName, collectedTests: spec.testFile.collectedTests };
        const fixture = new Fixture(fixtureDetails);
        const fixtureName = `Feature: ${spec.gherkinDocument.feature.name}`;

        fixture(fixtureName)
            .before(ctx => this.runFeatureHooks(this.gherkinBehavior.beforeAllHooks, ctx))
            .after(ctx => this.runFeatureHooks(this.gherkinBehavior.afterAllHooks, ctx))
            .meta(
                'tags',
                `${spec.gherkinDocument.feature.tags.length > 0
                    ? spec.gherkinDocument.feature.tags.map(tag => tag.name).reduce((acc, cur) => `${acc},${cur}`)
                    : ''}`
            );

        const fixtureTags = this.applyTagDataToFixture(spec, fixture);
        const firstTag = fixtureTags.filter(itm => itm.testCafeConfiguration?.timeouts)?.[0];

        spec.gherkinResult.forEach(({ pickle: scenario }) => {
            if (!scenario || !this.shouldRunScenario(<messages.Pickle>scenario)) {
                return;
            }

            const test: Test = new Test(fixtureDetails);
            const tagData: TestConfigurationItem[] = this.getScenarioTagData(scenario);
            const metadata: Map<string, string> = this.applyScenarioTagMetadata(tagData, test);

            const timeouts = firstTag?.testCafeConfiguration?.timeouts;

            function truncateTestName(str: string, num: number): string {
                if (str.length <= num) {
                    return str;
                }

                console.log(`${ConsoleColor.FgYellow}WARN: name for test is longer than ${num} characters - consider renaming for clarity:${ConsoleColor.Reset}
                ${ConsoleColor.FgCyan}${str}${ConsoleColor.Reset}`);

                return str.slice(0, num) + '...';
            }

            test(`Scenario: ${scenario.name.length > 200 ? truncateTestName(scenario.name, 200) : scenario.name}`, async (t: TestController) => {
                let error;

                t.ctx['currentTest'] = scenario.name;
                t.ctx.metadata = metadata;

                const lockState = {
                    testName: scenario.name,
                    shouldLock: false,
                    ignoreLock: false
                } as LockState;

                if (t.ctx.metadata.lock) {
                    lockState.shouldLock = Boolean(t.ctx.metadata.lock);
                    TestLockManager.addToQueue(lockState);
                }

                if (t.ctx.metadata.ignoreLock) {
                    lockState.ignoreLock = Boolean(t.ctx.metadata.ignoreLock);
                }

                console.log(` ${scenario.name}`);
                error = null;
                error = await this.runScenario(<messages.Pickle>scenario, error, lockState, t);

                this.ensureOnMainwindow(t);

                TestLockManager.markComplete(lockState);

                if (error) {
                    // save log information IF a test fails. 
                    const dir = './Reports';
                    const browserDir = join(dir, State.currentBrowser);
                    const fileNameFormat = `${moment().toISOString()}_${fixtureName}_${scenario.name}`;
                    await State.saveLogFile(browserDir, fileNameFormat, '.txt');

                    throw error;
                }

                State.flushLog();
            })
                .page('about:blank')
                .before(async (t: TestController) => {
                    await t.setTestSpeed(Configuration.application.frameworkConfig.testSpeed);
                    await this.runHooks(this.gherkinBehavior.findHook(scenario, this.gherkinBehavior.beforeHooks), t);
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ?.after(async (t: any) => {
                    await this.runHooks(this.gherkinBehavior.findHook(scenario, this.gherkinBehavior.afterHooks), t);
                })
                .meta(
                    'tags',
                    scenario.tags.length > 0 ? scenario.tags.map(tag => tag.name).reduce((acc, cur) => `${acc},${cur}`) : ''
                )
                .meta(
                    'fullScenarioName',
                    scenario.name
                )
                .timeouts({
                    pageLoadTimeout: timeouts?.pageLoadTimeout ? timeouts.pageLoadTimeout : Configuration.application.frameworkConfig.pageLoadTimeoutMs,
                    pageRequestTimeout: timeouts?.pageRequestTimeout ? timeouts.pageRequestTimeout : Configuration.application.frameworkConfig.pageRequestTimeout,
                    ajaxRequestTimeout: timeouts?.ajaxRequestTimeout ? timeouts.ajaxRequestTimeout : Configuration.application.frameworkConfig.ajaxTimeoutMs
                });
        });

        return spec.testFile.collectedTests;
    }

    private applyScenarioTagMetadata(tagData: TestConfigurationItem[], test: any) {
        const metadata: Map<string, string> = new Map();
        for (const data of tagData) {
            if (data?.testCafeConfiguration?.metadata) {
                for (const key of Object.keys(data.testCafeConfiguration.metadata)) {
                    test.meta(key, data.testCafeConfiguration.metadata[key]);
                    metadata[key] = data.testCafeConfiguration.metadata[key];
                }
            }
        }

        return metadata;
    }

    private getScenarioTagData(scenario: messages.IPickle) {
        const tagData: TestConfigurationItem[] = [];
        for (const tag of scenario.tags) {
            const data = Configuration.tests.getTag(tag.name.slice(1));
            if (data) {
                tagData.push(data);
            }
        }

        return tagData;
    }

    private applyTagDataToFixture(spec: Spec, fixture: FixtureFn) {
        const tagData: TestConfigurationItem[] = [];
        spec.gherkinDocument.feature.tags.forEach(element => {
            const data = Configuration.tests.getTag(element.name.slice(1));
            if (data) {
                tagData.push(data);
            }
        });

        let requestMocker: RequestMock;
        const clientScripts: string[] = [];
        for (let i = 0; i < tagData.length; i++) {
            const data = tagData[i];
            if (data.testCafeConfiguration) {
                if (data.testCafeConfiguration.metadata) {
                    const keys = Object.keys(data.testCafeConfiguration.metadata);
                    for (let key = 0; key < keys.length; key++) {
                        fixture.meta(keys[key], data.testCafeConfiguration.metadata[keys[key]]);
                    }
                }

                if (data.testCafeConfiguration.clientScripts) {
                    clientScripts.push(...data.testCafeConfiguration.clientScripts);
                }

                if (data.testCafeConfiguration.page) {
                    fixture.page(data.testCafeConfiguration.page);
                }

                if (data.testCafeConfiguration.mockApiProviders?.length ?? 0 > 0) {
                    if (!requestMocker) {
                        requestMocker = RequestMock();
                    }

                    const product = this.project.products.filter(itm => itm.productName === Configuration.product.split('.')[0])[0];
                    if (product.mockApiRequests) {
                        data.testCafeConfiguration.mockApiProviders.forEach(mock => {
                            const mockMetadata = product.mockApiRequests.filter(itm => itm.name === mock)[0];
                            let url: string;

                            if (mockMetadata.usesApplicationUrl) {
                                const urlPrefix = Configuration.application.ssl ? 'https://' : 'http://';
                                const tempUrl = `${Configuration.application.testHost}${Configuration.application.applicationRoot}${mockMetadata.requestTo}`;
                                url = `${urlPrefix}${tempUrl.replace('//', '/')}`;
                            } else {
                                url = `${mockMetadata.hostUrl}${mockMetadata.requestTo}`;
                            }

                            const regex = new RegExp(url.replace(/\//g, '\\/').replace(/\./g, '\\.').replace(/\?/g, '\\?').replace(/&/g, '\\&'));
                            requestMocker.onRequestTo(regex).respond(mockMetadata.responseBody, mockMetadata.responseStatusCode);
                        });
                    }
                }
            }
        }

        if (clientScripts && clientScripts.length > 0) {
            clientScripts.map((script) => fixture.clientScripts({ path: script }));
        }

        if (requestMocker) {
            fixture.requestHooks(requestMocker);
        }

        return tagData;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private allowsReruns(scenario: any, feature: any) {
        return scenario.tags.filter(itm => itm.name.toString().toLowerCase() === allowRetryTag.toLowerCase()).length > 0 ||
            feature.tags.filter(itm => itm.name.toString().toLowerCase() === allowRetryTag.toLowerCase());
    }

    private ensureOnMainwindow(t: TestController) {
        t.switchToMainWindow().then(() => {
            State.log(new LogItem('Switched back to main window', Level.Debug));
        });
    }
};

