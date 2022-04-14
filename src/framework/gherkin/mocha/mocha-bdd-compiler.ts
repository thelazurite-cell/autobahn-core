import { GherkinExecutor } from '../support/gherkin-executor';
import { getMatches, getTestFilter } from '../support/helper-functions';
import TestcafeESNextCompiler from 'testcafe/lib/compiler/test-file/formats/es-next/compiler';
import TestcafeTypescriptCompiler from 'testcafe/lib/compiler/test-file/formats/typescript/compiler';
import { Spec } from '../support/models/spec';
import Mocha, { Suite, Test } from 'mocha';
import { DataTable } from '@cucumber/cucumber';
import { Configuration } from '../../configuration/configuration';
import { messages } from '@cucumber/messages';
import { TestConfigurationItem } from '../../configuration/test-configuration-item';
import { inject, injectable } from 'inversify';
import { MochaCompiler } from './mocha-compiler.abstract';
import { FrameworkFunctionality } from '../../framework-functionality.config';
import { MochaController } from './mocha-controller';
import { LockState } from '../../driver/lock-state';
import { args } from '../../framework.config';

export type MochaReporterParams = { output: string };

@injectable()
export default class MochaBddCompiler extends GherkinExecutor implements MochaCompiler {
    sources: string[];
    externalCompilers: Compiler[];
    report: string;
    reportOptions: MochaReporterParams;
    mochaRunner = new Mocha({
        ui: 'bdd',
        reporter: Configuration.application.frameworkConfig.mochaReporters,
        fullStackTrace: process.argv.findIndex(val => val === '--debug') > -1,
        timeout: Configuration.application.frameworkConfig.pageLoadTimeoutMs,
        // mocha expects the amount of retries after the first failure, instead of the total amount of attempts
        retries: Configuration.application.frameworkConfig.maxTestAttempts - 1,
        slow: Configuration.application.frameworkConfig.assertionTimeoutMs
    });

    constructor(
        @inject(FrameworkFunctionality.MochaSources) sources: string[],
        @inject(FrameworkFunctionality.MochaReportType) report: string,
        @inject(FrameworkFunctionality.MochaReportOptions) reportOptions: MochaReporterParams
    ) {
        super(sources);
        this.sources = sources;
        this.report = report;
        this.reportOptions = reportOptions;
        this.filterOptions = getTestFilter();
        this.externalCompilers = [
            new TestcafeESNextCompiler(),
            new TestcafeTypescriptCompiler()
        ];
    }


    public async run(): Promise<number> {
        await this.fetchTests();

        if (this.reportOptions) {
            this.mochaRunner.reporter(this.report, this.reportOptions);
        } else {
            this.mochaRunner.reporter(this.report);
        }

        return new Promise((resolve, reject) => {
            try {
                this.mochaRunner.run((failures) => {
                    resolve(failures);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private async fetchTests() {
        await this.gherkinBehavior.loadStepDefinitions(this.externalCompilers);
        const tests = await Promise.all(
            this.specFiles.map(async (specFile) => {
                const spec = await this.gherkinBehavior.loadSpec(specFile);
                return this.processFeatures(spec);
            })
        );

        return tests;
    }

    private processFeatures(spec: Spec): Suite {
        const fixtureName = `Feature: ${spec.gherkinDocument.feature.name}`;
        const fixtureSuite = Suite.create(this.mochaRunner.suite, fixtureName);

        // we only create the fixture if all configured tags state they should be run. 
        const tags: TestConfigurationItem[] = spec.gherkinDocument.feature.tags.map(tag => Configuration.tests.getTag(tag.name));
        if (!tags?.every(tag => tag?.shouldRun ?? true) && (tags?.length ?? 0) > 0) {
            return;
        } else if (this.filterOptions?.fixtureName && getMatches(fixtureName, this.filterOptions.fixtureName).length === 0) {
            return;
        }


        spec.gherkinResult.forEach(({ pickle: scenario }) => {
            if (!scenario?.name) {
                return;
            }

            // we only create the test if all configured tags state they should be run. 
            const testName = `Scenario: ${scenario.name}`;
            const textTags: string[] = [];
            const testTags: TestConfigurationItem[] =[];

            for(const tag of scenario.tags) { 
                const tagName = tag.name.replace('@','');
                const configurationTag = Configuration.tests.getTag(tagName);
                textTags.push(tagName.toLowerCase());
                testTags.push(configurationTag);
            }

            const filterTags = args.tags;

            // if there are configured tags, and any of them is set to ignore, skip the test
            if ((testTags?.length ?? 0) > 0 && !testTags?.every(tag => tag?.shouldRun ?? true)) {
                return;
            }

            // if the tests are being filtered by tag, and the pattern isn#t matched, skip
            if (filterTags && filterTags.length > 0 && textTags.filter(itm => itm === filterTags.toLowerCase()).length === 0){
                return;
            }

            // if the tests are being filtered by test name, and the pattern isn#t matched, skip
            else if (this.filterOptions?.testName && getMatches(testName, this.filterOptions.testName).length === 0) {
                return;
            }

            const ctx = new MochaController();
            ctx.runType = 'mocha';
            ctx.testName = testName;
            ctx.fixtureName = fixtureName;
            ctx.testLocation = scenario.uri;

            const test = new Test(testName, (done) => {
                // ctx.callback = done;
                const error = null;
                this.runScenario(
                    scenario as messages.Pickle,
                    error,
                    {
                        ignoreLock: true,
                        thisSetLock: false,
                        shouldLock: false
                    } as LockState,
                    ctx).then((error) => {
                        done(error);
                    }).catch(error => done(error));
            });

            // test.retries(Configuration.application.frameworkConfig.maxTestAttempts);
            fixtureSuite.addTest(test);

        });

        return fixtureSuite;
    }

    protected async runStep(step: Func, parameters: string[], table: DataTable = null, context: MochaController): Promise<void> {
        // we don't have a @typeof TestController when running mocha. 
        return await step(context, parameters, table);
    }
}