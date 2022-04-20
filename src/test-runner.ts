/*
* test-runner.ts

*
* configures testcafe based off configuration files and parameters passed through to the cli
*/
import 'reflect-metadata';
import { LogItem } from './framework/logging/log-item';
import { State } from './framework/logging/state';
import { Level } from './framework/logging/level';
import { TestConfigurationItem } from './framework/configuration/test-configuration-item';
import Mocha from 'mocha';
import moment from 'moment';
import { Reporter, Runner } from './framework/gherkin/runner';
import { Sources } from './framework/configuration/sources';
import { SourcesType } from './framework/configuration/sources-type.enum';
import { Configuration } from './framework/configuration/configuration';
import { FrameworkArguments } from './framework-arguments';
import { SslOptions } from './ssl-options';
import { ConsoleColor } from './framework/helpers/console-color.enum';
import { FrameworkSettings } from './framework/configuration/framework-settings';
import { TestCafeInstance } from './framework/gherkin/testcafe/testcafe-instance';
import { FrameworkContainer } from './framework/framework.config';
import { MochaCompiler } from './framework/gherkin/mocha/mocha-compiler.abstract';
import { FrameworkFunctionality } from './framework/framework-functionality.config';
import { FrameworkTags } from './framework/framework-tags.config';
import { Project } from './framework/generator/model/project';
import { NewmanRunner } from './framework/newman/newman-runner';
import { GlobReader } from './framework/gherkin/support/glob-reader';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

export class TestRunner {
    private startedAt: string;

    private static readonly reportsFolderBase: string = 'Reports/';

    public static reportsFolder = `${TestRunner.reportsFolderBase ?? 'Reports/'}${moment().utc().format('YYYY-MM-DD_HH-mm')}`;

    public reportsFolder: string;

    private sslOptions: SslOptions;

    private args: FrameworkArguments;

    private ignoredTags: TestConfigurationItem[];

    private runnerQueue: string[];

    public canRunNextStage: boolean = true;

    public mocha: MochaCompiler;
    public newman: NewmanRunner;

    public runner: Runner;

    public static project: Project = new Project();

    public static readProjectFile = () => {
        const path = join(process.cwd(), 'config', 'project.json');
        try {
            const file = readFileSync(path, { encoding: 'utf8' });
            return JSON.parse(file);
        } catch (e) {
            console.log(`Could not read the project file. Check it exists in: ${path}`);
        }
    };

    constructor(args: FrameworkArguments) {
        this.args = args;
        State.args = args;
        this.ignoredTags = Configuration.tests.testConfiguration.filter(itm => itm.shouldRun === false);
        this.runnerQueue = this.args.browser ? this.args.browser.toString().split('|') : [Configuration.application.frameworkConfig.defaultBrowser];
        const useGherkin = Configuration.application.frameworkConfig.sources.filter(itm => itm.type == SourcesType.api)?.[0]?.useGherkin ?? true;
        this.mocha = FrameworkContainer.getTagged<MochaCompiler>(FrameworkFunctionality.MochaApi, FrameworkTags.useGherkin, useGherkin ?? true);
        const projectText = TestRunner.readProjectFile();

        Object.assign(TestRunner.project, projectText);
        Configuration.ignoresRegistry = TestRunner.project.ignoresRegistry;
    }

    /**
     * attempts to set the SSL certificate settings
     * @returns true if the values were set succcessfully.
     */
    public sslSettingsWereSet(): boolean {
        try {
            this.attemptApplyingSslSettings();
            return true;
        }
        catch (e) {
            console.error('Couldn\'t load the SSL configuration');
            console.error(e);
            process.exit(-1);
            return false;
        }
    }

    /**
     * Attempts to apply the expected ssl settings.
     */
    public attemptApplyingSslSettings(): void {
        if (TestRunner.project.usesCertificates) {
            const selfSigned = require('openssl-self-signed-certificate');

            this.sslOptions = {
                key: selfSigned.key,
                cert: selfSigned.cert,
            };
        }
    }

    /**
     * Runs the expected test runners based off the configured sources.
     */
    public run(): Promise<void> {
        this.configureReports();
        const sources = Configuration.application.frameworkConfig.sources;

        return new Promise((resolve, reject) => {
            if (this.hasSourcesFor(sources, SourcesType.newman)) {
                this.runNewmanTests(sources)
                    .then(() => this.codeBasedTests(sources, resolve, reject))
                    .catch((e) => reject(e));
            } else {
                this.codeBasedTests(sources, resolve, reject);
            }
        });
    }

    private codeBasedTests(sources: Sources[], resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: any) => void) {
        this.checkAndRunApiTests(sources).then(() => {
            if (this.canRunNextStage && this.sslSettingsWereSet()) {

                State.log(new LogItem(`Downloads Directory: ${State.downloadsDirectory}`));
                State.createMissingDirectories(State.downloadsDirectory);

                // wait for the promise to resolve
                this.runBrowserTests().then(() => {
                    resolve();
                }).catch(e => reject(e));
            } else {
                resolve();
            }
        });
    }

    private configureReports() {
        State.createMissingDirectories(resolve(`./${TestRunner.reportsFolder}`));
        if (this.args.browserReports) {
            Configuration.application.frameworkConfig.testcafeReporters = this.args.browserReports;
        }
    }

    /**
     * Checks if the provided configuration file references existing API tests, and then runs them
     * @param sources the sources configuration from the app config file
     */
    private checkAndRunApiTests(sources: Sources[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.hasSourcesFor(sources, SourcesType.api) || this.hasSourcesFor(sources, SourcesType.newman)) {
                this.runApiTests(sources)
                    .then(() => resolve())
                    .catch((e) => reject(e));
            } else {
                resolve();
            }
        });
    }

    public async runNewmanTests(sources: Sources[]): Promise<void> {
        try {
            const newmanRunner = new NewmanRunner();

            const globs = sources.filter(itm => itm.type == SourcesType.newman)[0];
            const sourceFiles = GlobReader.getTestFiles(globs.locations);

            const failures = await newmanRunner.run(sourceFiles, 'xunit', TestRunner.reportsFolder);

            return new Promise((resolve, reject) => {
                this.processFailures(failures, sources)
                    .then((res) => resolve(res))
                    .catch((e) => reject(e));
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Runs any api tests that have been configured.
     * @param sources the configured sources.
     */
    public async runApiTests(sources: Sources[]): Promise<void> {
        try {
            const failures = await this.mocha.run();
            return new Promise((resolve, reject) => {
                this.processFailures(failures, sources)
                    .then((res) => resolve(res))
                    .catch((e) => reject(e));
            });
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Determines if a report should be saved
     * @param mocha the mocha configuration
     */
    public determineIfReportShouldBeSaved(mocha: Mocha): void {
        if (this.args.saveReport) {
            const reporter = Configuration.application.frameworkConfig.mochaReporters;
            mocha.reporter(
                reporter,
            );
        }
    }

    /**
     * Process mocha test failures
     * @param failures the amount of test failures.
     * @param sources the configured test sources.
     */
    public processFailures(failures: number, sources: Sources[]): Promise<void> {
        if (failures > 0) {
            this.canRunNextStage = false;
            console.error(`${ConsoleColor.FgRed}There were ${failures} failures. Not continuing with browser tests${ConsoleColor.Reset}`);
            process.exit(-1);
        }

        if (!this.hasSourcesFor(sources, SourcesType.browser)) {
            this.canRunNextStage = false;
            process.exit(0);
        }

        return Promise.resolve();
    }



    /**
     * Determines whether the configured sources has the expected sources type
     * @param sources the sources stored in configuration
     * @param sourcesType the sources type to check for
     * @returns true if the configuration has the expected sources type
     */
    public hasSourcesFor(sources: Sources[], sourcesType: SourcesType): boolean {
        return sources.filter((itm: Sources) => itm.type === sourcesType).length > 0;
    }

    /**
     * Runs all specified browser tests for each browser provided.
     */
    public runBrowserTests(): Promise<void> {
        this.startedAt = moment().format('YYYY-MM-DD_HH:mm:ss');
        const thisBrowser = this.runnerQueue.pop();

        return new Promise((resolve) => {
            let tc: TestCafeInstance;

            this.createInstance()
                .then(async (testcafe: TestCafeInstance) => {
                    tc = testcafe;

                    this.runner = this.createRunner(tc);
                    const browserStr = await this.getBrowser(thisBrowser);
                    const tagConfig = this.determineTags();
                    this.logConfiguration();
                    this.completeInit(thisBrowser);
                    return this.configureRunner(tagConfig, browserStr, thisBrowser);
                })
                .then((failedCount: number) => {
                    console.log('Tests failed: ' + failedCount.toString());
                    console.log(`Started at: ${this.startedAt} Completed at: ${moment().format('YYYY-MM-DD_HH:mm:ss')}`);
                    if (this.runnerQueue.length > 0) {
                        this.runBrowserTests();
                    }
                    else {
                        resolve(process.exit(failedCount > 0 ? -1 : 0));
                    }
                });
        });
    }

    /**
     * Creates a testcafe instance
     * @returns the testcafe instance
     */
    public async createInstance(): Promise<TestCafeInstance> {
        require('./framework/gherkin/testcafe/rewire-argument-parser');
        require('./framework/gherkin/testcafe/rewire-compiler');
        require('./framework/gherkin/testcafe/rewire-runner');

        const createInstance = require('./framework/gherkin/testcafe/main');

        const port = await State.getPort();
        const alternatePort = await State.getPort();
        return createInstance('localhost', port, alternatePort, TestRunner.project.usesCertificates ? this.sslOptions : null);//.retryTestPages();
    }

    /**
     * Creates the testcafe test runner
     * @param tc the testcafe instance
     * @returns the testcafe test runner
     */
    public createRunner(tc: { retryTestPages: (arg0: boolean) => void, createRunner: () => Runner }): Runner {
        State.log(new LogItem('Initializing test framework'));
        return tc.createRunner();
    }

    /**
     * Gets the expected browser command for use with testcafe based on how the runner has been set up
     * and by the browser provided.
     * @param thisBrowser the browser to set up the command for.
     * @returns browser the browser command to be used by testcafe
     */
    public async getBrowser(thisBrowser: string): Promise<string> {
        const match = TestRunner.project.browsers.filter(itm => itm.name.toLowerCase() === thisBrowser.toLowerCase());
        const isHeadless = this.args.headless;
        let browserStr = isHeadless ? `${thisBrowser}:headless` : thisBrowser;

        if (match.length > 0) {
            browserStr = `${browserStr}${isHeadless ? match[0].headlessCommand : match[0].command}`;
            const chromePort = await State.getPort(9100, 9200);
            browserStr = browserStr.replace('{{randomPort}}', chromePort.toString());
            console.log(browserStr);
        }

        return browserStr;
    }

    /**
     * Logs the configuration parameters that have been sent to the runner via the CLI
     */
    private logConfiguration(): void {
        if (!this.args.url) {
            State.log(new LogItem('No url specified, falling back to localhost.', Level.Warning));
        }

        State.log(new LogItem(`Headless: ${this.args.headless?.toString() ?? 'false'}`));
        State.log(new LogItem('Config:'));
        State.log(new LogItem(JSON.stringify(this.args, null, 2)));
    }

    /**
     * Configures the testcafe runner for use, based on the provided configuration
     * and then runs the framework.
     * @param tags the tags to run and ignore
     * @param browserStr the browser command to use
     * @param thisBrowser the name of the browser being used
     * @returns the results of the test run
     */
    private configureRunner(tags: string[], browserStr: string, thisBrowser: string) {
        const allLocations: string[] = this.getBrowserTestFiles();

        this.configureTestRunner(allLocations, tags, browserStr, thisBrowser);
        // console.log(`Started at: ${}`);
        return this.runner.run(this.args);
    }

    /**
     * Configures the test runner with mandatory items, alongside any configured elements
     * and values provided to the CLI
     * @param allLocations all source locations to be used by the testcafe framework
     * @param tags the tags to run and ignore
     * @param browserStr the browser command
     * @param outputFile the file to output any xunit/spec logs to.
     */
    private configureTestRunner(allLocations: string[], tags: string[], browserStr: string, thisBrowser: string) {
        const framework = Configuration.application.frameworkConfig;

        this.runner
            .src(allLocations).tags(tags)
            .browsers(browserStr)
            .video(`${TestRunner.reportsFolder}/videos/`, {
                singleFile: false,
                failedOnly: true
            })
            .screenshots({
                path: `${TestRunner.reportsFolder}/screenshots/`,
                takeOnFails: true,
                fullPage: false

            });
        //.retryTestPages();

        this.applyArgumentSpecificConfig(framework, thisBrowser);
    }

    /**
     * Applys argument and product specific configuration
     * @param framework the framework settings to read from
     * @param outputFile the location of the report to save into.
     */
    public applyArgumentSpecificConfig(framework: FrameworkSettings, thisBrowser: string): void {
        if (this.args.pt) {
            framework.parallelThreads = this.args.pt;
        }

        this.setReporters(framework, thisBrowser);
        if (this.args.debug) {
            this.runner.clientScripts([{ path: join(__dirname, './snoopy.js') }]);
        }

        if (this.args.filterTest) {
            this.runner.filterTest(this.args.filterTest);
        }

        if (framework.parallelThreads > 1) {
            this.runner.concurrency(framework.parallelThreads);
        }
    }

    private setReporters(framework: FrameworkSettings, thisBrowser: string) {
        const reporters = framework.testcafeReporters.split(',');
        if (this.args.saveReport) {
            const reportersWithOutput: Reporter = [];
            for (const current of reporters) {
                const reportFile = TestRunner.getReportFileName(`browser-${thisBrowser}`, current);
                reportersWithOutput.push(reportFile ? { name: current, output: reportFile } : current);
            }

            this.runner.reporter(reportersWithOutput);
        } else {
            this.runner.reporter(reporters);
        }
    }

    /**
     * Gets the browser test files to use
     * @returns browser test files 
     */
    public getBrowserTestFiles(): string[] {
        const sources = Configuration.application.frameworkConfig.sources.filter((itm: Sources) => itm.type === SourcesType.browser);
        const allLocations: string[] = [];
        sources.forEach((itm: Sources) => allLocations.push(...itm.locations));
        return allLocations;
    }

    /**
     * Gets the report file name for the current product and type
     * @param type the type of tests being run
     * @returns report file name 
     */
    public static getReportFileName(type: string, reportType: string): string {
        const replacables = {
            'product': Configuration.product,
            'environment': Configuration.environment,
            'sourceType': type
        };

        const reportConfig = TestRunner.project.reporting.types.filter(itm => itm.name === reportType).pop();

        let reportName = TestRunner.project.reporting.defaultFileNamePattern;
        let reportExtension = TestRunner.project.reporting.defaultExtension;

        if (reportConfig) {
            if (reportConfig.extension) {
                reportExtension = reportConfig.extension;
            }

            if (reportConfig.fileNamePattern) {
                reportName = reportConfig.fileNamePattern;
            }
        }

        Object.keys(replacables).forEach(itm => reportName = reportName.replace(new RegExp(`\\[${itm}\\]`, 'ig'), replacables[itm]));

        return join(process.cwd(), TestRunner.project.reporting.outputFolder, `${reportName}.${reportExtension}`);
    }

    /**
     * Completes initialization of the test framework
     * @param browserStr the name of the browser that was initialized
     */
    public completeInit(browserStr: string): void {
        const initReportsDirectory = join(process.cwd(), TestRunner.project.reporting.outputFolder, 'init');
        const initReportFileName = `${this.getDateFormat()}_init_${browserStr}`;

        State.saveLogFile(initReportsDirectory, initReportFileName, '.txt').catch((reason) => {
            console.error('Couldn\'t save log file');
            console.error(reason);
        });

        State.currentBrowser = browserStr;
    }

    /**
     * Gets the current date in the expected format
     * @returns the current date.
     */
    public getDateFormat(): string {
        return moment().toISOString();
    }

    /**
     * Determines which tags should be used, and which should be ignored
     * if a tag has been marked as disabled, then the reason will be logged.
     * @returns the tags to run and ignore
     */
    public determineTags(): string[] {
        const tags: string[] = [];
        for (const idx of this.ignoredTags) {
            tags.push(`~@${idx.tag}`);
            State.log(new LogItem(`Ignoring tests tagged with ${idx.tag} because ${idx.because}`, Level.Warning));
        }

        if (this.args.tags) {
            const runnable: string[] = this.args.tags.toString().split('|');
            for (const tag of runnable) {
                tags.push(`@${tag}`);
            }
        }

        return tags;
    }
}
