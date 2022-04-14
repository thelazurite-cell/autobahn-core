/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { FrameworkArguments } from '../../framework-arguments';
import { Configuration } from '../../framework/configuration/configuration';
import { TestRunner } from '../../test-runner';
import { expect } from 'chai';
import { SourcesType } from '../../framework/configuration/sources-type.enum';
import Mocha from 'mocha';
import moment from 'moment';
import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { ConsoleColor } from '../../framework/helpers/console-color.enum';
import { TestCafeRunnerStub } from '../helper-classes/testcafe-runner-stub';
import { State } from '../../framework/logging/state';
import { Level } from '../../framework/logging/level';
import { LogItem } from '../../framework/logging/log-item';
import { TestCafeInstance } from '../../framework/gherkin/testcafe/testcafe-instance';
import { GlobReader } from '../../framework/gherkin/support/glob-reader';
import { args } from '../../framework/framework.config';
import { MochaVanillaCompiler } from '../../framework/gherkin/mocha/mocha-vanilla-compiler';
import MochaBddCompiler from '../../framework/gherkin/mocha/mocha-bdd-compiler';
import { Browser } from '../../framework/configuration/browser';

const previousDir = '..';

describe('Test runner class', () => {
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();
    let consoleStub: sinon.SinonStub;

    before(() => {
        chai.use(chaiAsPromised);
    });

    beforeEach(() => {
        TestRunner.readProjectFile = () => {
            return {
                usesCertificates: false,
                ignoresRegistry: true,
                browsers: [
                    {
                        name: 'firefox',
                        command: '',
                        headlessCommand: ''
                    },
                    {
                        name: 'chrome',
                        command: ' --allow-insecure-localhost --allow-running-insecure-content --start-maximized --enable-automation --disable-backgrounding-occluded-windows --disable-background-timer-throttling',
                        headlessCommand: ' --disable-web-security --allow-insecure-localhost --allow-running-insecure-content --enable-automation'
                    },
                    {
                        name: 'edge',
                        command: ' --allow-insecure-localhost --allow-running-insecure-content --start-maximized --enable-automation --disable-backgrounding-occluded-windows --disable-background-timer-throttling',
                        headlessCommand: ' --disable-web-security --allow-insecure-localhost --allow-running-insecure-content --enable-automation'
                    }
                ],
            };
        };

        consoleStub = sandbox.stub(console, 'log').callsFake(() => { return; });
    });

    afterEach(() => {
        sandbox.restore();
    });


    describe('API Testing', () => {
        describe('Initializing the test runner', () => {
            beforeEach(() => {
                Configuration.product = 'unit-testing';
                Configuration.environment = 'all';
                Configuration.reinitialize();
            });

            it('Should set the output option if the --saveReport option has been provided', () => {
                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    saveReport: true
                };

                const mocha = new Mocha();

                const testRunner = new TestRunner(options);

                const mochaStub = sandbox.stub(mocha, 'reporter');

                testRunner.determineIfReportShouldBeSaved(mocha);

                sinon.assert.calledOnce(mochaStub);
            });

            it('Should ensure the correct options have been provided to mocha vanilla compiler', () => {
                const expectedReportType = 'xunit';
                const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                const timestampFolder = moment().utc().format(expectedDateFormat);
                TestRunner.reportsFolder = `Reports/${timestampFolder}`;
                const expectedReportOptions = { output: `Reports/${timestampFolder}/report.unit-testing.all.api.xml` };

                args.saveReport = true;

                const mocha = new MochaVanillaCompiler([], expectedReportType, expectedReportOptions);
                TestRunner.reportsFolder = `Reports/${moment().utc().format('YYYY-MM-DD_HH-mm-ss')}`;

                const momentStub = sandbox.stub(moment.fn, 'format');
                momentStub.callsFake(() => timestampFolder);
                const mochaStub = sandbox.stub(mocha.mochaRunner, 'reporter');
                sandbox.stub(mocha.mochaRunner, 'run');

                mocha.run().then(() => {
                    sinon.assert.calledOnce(mochaStub);
                    sinon.assert.calledWith(mochaStub, expectedReportType, expectedReportOptions);
                });
            });

            it('Should ensure the correct options have been provided to mocha BDD compiler', () => {
                const expectedReportType = 'xunit';
                const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                const timestampFolder = moment().utc().format(expectedDateFormat);
                TestRunner.reportsFolder = `Reports/${timestampFolder}`;
                const expectedReportOptions = { output: `Reports/${timestampFolder}/report.unit-testing.all.api.xml` };

                args.saveReport = true;

                const mocha = new MochaBddCompiler([], expectedReportType, expectedReportOptions);
                TestRunner.reportsFolder = `Reports/${moment().utc().format('YYYY-MM-DD_HH-mm-ss')}`;

                const momentStub = sandbox.stub(moment.fn, 'format');
                momentStub.callsFake(() => timestampFolder);
                const mochaStub = sandbox.stub(mocha.mochaRunner, 'reporter');
                sandbox.stub(mocha.mochaRunner, 'run');

                mocha.run().then(() => {
                    sinon.assert.calledOnce(mochaStub);
                    sinon.assert.calledWith(mochaStub, expectedReportType, expectedReportOptions);
                });
            });

            it('Should not set the output option if --saveReport was not provided', () => {
                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    saveReport: false
                };

                const mocha = new Mocha();


                const testRunner = new TestRunner(options);
                const reporterSpy = sandbox.spy(mocha, 'reporter');

                testRunner.determineIfReportShouldBeSaved(mocha);
                sinon.assert.notCalled(reporterSpy);
            });

            it('Should be able to identify that a config file contains API tests', () => {
                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment
                };



                const testRunner = new TestRunner(options);

                const sut = testRunner.hasSourcesFor(Configuration.application.frameworkConfig.sources, SourcesType.api);

                expect(sut).to.eql(true);
            });

            it('Should be able to identify test locations correctly', () => {
                const baseSpecPath = path.join(__dirname, previousDir, previousDir, 'products', 'unit-testing', 'specs');

                const expected = [
                    path.join(baseSpecPath, 'api', 'hp', 'example.spec.js'),
                    path.join(baseSpecPath, 'second-api', 'hp', 'second-example.spec.js'),
                    path.join(baseSpecPath, 'second-api', 'hp', 'third-example.spec.js')
                ];
                const sut = GlobReader.getTestFiles(Configuration.application.frameworkConfig.sources.filter(itm => itm.type === SourcesType.api)[0].locations);

                expect(sut).to.eql(expected);
            });

            it('Should set the correct name for the XUnit report', () => {
                TestRunner.reportsFolder = `Reports/${moment().utc().format('YYYY-MM-DD_HH-mm-ss')}`;

                const sut = TestRunner.getReportFileName(SourcesType.api, 'xunit');
                const expected = `${TestRunner.reportsFolder}/report.${Configuration.product}.${Configuration.environment}.api.xml`;

                expect(sut).to.eql(expected);
            });
        });

        describe('Running the API test framework', () => {
            let testRunner: TestRunner;
            let exitStub: sinon.SinonStub;
            let browserTestStub: sinon.SinonStub;

            beforeEach(() => {
                Configuration.product = 'unit-testing';
                Configuration.environment = 'all';
                Configuration.reinitialize();

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment
                };



                testRunner = new TestRunner(options);

                // we don't want the process to exit as this will cancel the test run.
                exitStub = sandbox.stub(process, 'exit').callsFake((code?: number): never => {
                    console.info(`\t${ConsoleColor.Bright}⬐ process would've exited with code ${code | 0}${ConsoleColor.Reset}`);
                    return <never>{};
                });

                // we don't care about the browser tests at this point of time.
                browserTestStub = sandbox.stub(testRunner, 'runBrowserTests').callsFake(() => { return Promise.resolve(); });
            });

            it('Should call the mocha test runner', async () => {
                const stubRun = sandbox.stub(testRunner.mocha, 'run');
                stubRun.callsFake(() => Promise.resolve(0));

                await testRunner.run();

                sinon.assert.calledOnce(stubRun);
            });

            it('Should not continue to the browser tests if the tests fail', async () => {
                const stubRun = sandbox.stub(testRunner.mocha, 'run');
                const consoleStub = sandbox.stub(console, 'error');
                const expectedError = 'There were 1 failures. Not continuing with browser tests';
                const expectedExitCode = -1;

                stubRun.callsFake(() => {
                    return Promise.resolve(1);
                });

                await testRunner.run();

                sinon.assert.calledOnce(stubRun);
                expect(browserTestStub.called).to.eql(false);
                sinon.assert.calledOnceWithExactly(exitStub, expectedExitCode);
                expect(consoleStub.getCall(0).args[0]).to.contain(expectedError);
            });
        });

        describe('Running the test framework - Edge Cases', () => {
            let testRunner: TestRunner;
            let exitStub: sinon.SinonStub;
            let browserTestStub: sinon.SinonStub;

            beforeEach(() => {
                // we don't want the process to exit as this will cause the test run to exit before completing.
                exitStub = sandbox.stub(process, 'exit').callsFake((code?: number): never => {
                    console.info(`\t${ConsoleColor.Bright}⬐ process would've exited with code ${code | 0}${ConsoleColor.Reset}`);
                    return <never>{};
                });
            });

            it('Should run the browser tests after API tests have completed successfully', async () => {
                Configuration.product = 'unit-testing';
                Configuration.environment = 'all';
                Configuration.reinitialize(true);

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment
                };



                testRunner = new TestRunner(options);

                // we don't care about the browser tests at this point of time.
                browserTestStub = sandbox.stub(testRunner, 'runBrowserTests').callsFake(() => { return Promise.resolve(); });

                const stubRun = sandbox.stub(testRunner.mocha, 'run');
                stubRun.callsFake(() => Promise.resolve(0));

                await testRunner.run();

                sinon.assert.calledOnce(stubRun);
                sinon.assert.calledOnce(browserTestStub);
            });

            it('Should not attempt to run the API tests if there are no sources for it', async () => {
                Configuration.product = 'unit-testing.browser-only';
                Configuration.environment = 'all';
                Configuration.reinitialize(true);

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment
                };



                testRunner = new TestRunner(options);

                // we don't care about the browser tests at this point of time.
                browserTestStub = sandbox.stub(testRunner, 'runBrowserTests').callsFake(() => { return Promise.resolve(); });

                const stubRun = sandbox.stub(testRunner, 'runApiTests');
                stubRun.returns(Promise.resolve());
                await testRunner.run();

                expect(stubRun.called).to.eql(false);
                sinon.assert.calledOnce(browserTestStub);
            });

            it('Should not attempt to run the Browser tests if there are no sources for it', async () => {
                Configuration.product = 'unit-testing.api-only';
                Configuration.environment = 'all';
                Configuration.reinitialize(true);

                const expectedExitCode = 0;

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment
                };



                testRunner = new TestRunner(options);
                browserTestStub = sandbox.stub(testRunner, 'runBrowserTests').callsFake(() => { return Promise.resolve(); });

                const stubRun = sandbox.stub(testRunner.mocha, 'run');
                stubRun.callsFake(() => Promise.resolve(0));

                await testRunner.run();

                sinon.assert.calledOnce(stubRun);
                sinon.assert.calledOnceWithExactly(exitStub, expectedExitCode);
                expect(browserTestStub.called).to.eql(false);
            });
        });
    });

    describe('Browser Testing', () => {
        let exitStub: sinon.SinonStub;
        let apiTestStub: sinon.SinonStub;
        let testRunner: TestRunner;

        beforeEach(() => {
            Configuration.product = 'unit-testing';
            Configuration.environment = 'all';
            Configuration.reinitialize();

            const options: FrameworkArguments = {
                product: Configuration.product,
                environment: Configuration.environment,
                headless: true
            };



            testRunner = new TestRunner(options);
            testRunner.runner = TestCafeRunnerStub.create();
            apiTestStub = sandbox.stub(testRunner, 'runApiTests');
            apiTestStub.callsFake(() => { return Promise.resolve(); });

            // we don't want the process to exit as this will cancel the test run.
            exitStub = sandbox.stub(process, 'exit').callsFake((code?: number): never => {
                console.info(`\t${ConsoleColor.Bright}⬐ process would've exited with code ${code | 0}${ConsoleColor.Reset}`);
                return <never>{};
            });
        });

        describe('Tags', () => {
            it('Should be able to successfully determine the tags to ignore', () => {
                const expected = ['~@Ignore', '~@AnotherTagToIgnore', '~@Amet'];


                const sut = testRunner.determineTags();

                expect(sut).to.eql(expected);
            });

            it('Should log when a tag has been marked as ignored', () => {
                const expectedTag = 'Ignore';
                const expectedReason = 'Tests have been set as ignored. Ensure that they should be.';
                const expectedMessage = `Ignoring tests tagged with ${expectedTag} because ${expectedReason}`;
                const expectedLogLevel = Level.Warning;

                const stateSpy = sandbox.spy(State, 'log');

                testRunner.determineTags();

                sinon.assert.called(stateSpy);

                const firstLogItem: LogItem = stateSpy.getCall(0).args[0];
                expect(firstLogItem.constructor.name).to.eql('LogItem');
                expect(firstLogItem.level).to.eql(expectedLogLevel);
                expect(firstLogItem.message).to.eql(expectedMessage);
            });

            describe('Using the --tags CLI argument', () => {
                const runs = [
                    { tags: 'IncludedTag', expectedOutput: ['~@Ignore', '~@AnotherTagToIgnore', '~@Amet', '@IncludedTag'] },
                    { tags: 'IncludedTag|AnotherTag', expectedOutput: ['~@Ignore', '~@AnotherTagToIgnore', '~@Amet', '@IncludedTag', '@AnotherTag'] },
                    { tags: 'a|b|c|d', expectedOutput: ['~@Ignore', '~@AnotherTagToIgnore', '~@Amet', '@a', '@b', '@c', '@d'] },
                    { tags: 'e|f|g|h|i|j|l|m', expectedOutput: ['~@Ignore', '~@AnotherTagToIgnore', '~@Amet', '@e', '@f', '@g', '@h', '@i', '@j', '@l', '@m'] },
                ];

                runs.forEach(run => {
                    it(`Should explicitly set the tags to run if --tags has been called with ${run.expectedOutput.length - 3} tag(s)`, () => {
                        const options: FrameworkArguments = {
                            product: Configuration.product,
                            environment: Configuration.environment,
                            headless: true,
                            tags: run.tags
                        };

                        testRunner = new TestRunner(options);
                        testRunner.runner = TestCafeRunnerStub.create();
                        apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                        apiTestStub.callsFake(() => { return Promise.resolve(); });

                        const sut = testRunner.determineTags();

                        expect(sut).to.eql(run.expectedOutput);
                    });
                });
            });
        });

        describe('Getting browser commands', () => {
            it('should be able to get the default browser command when not running headlessly', async () => {
                const expectedCommand = 'chrome --allow-insecure-localhost --allow-running-insecure-content --start-maximized --enable-automation --disable-backgrounding-occluded-windows --disable-background-timer-throttling';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: false
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();

                const sut = await testRunner.getBrowser(Configuration.application.frameworkConfig.defaultBrowser);
                expect(sut).to.eql(expectedCommand);
            });

            it('should be able to get the default browser command when running headlessly', async () => {
                const expectedCommand = 'chrome:headless --disable-web-security --allow-insecure-localhost --allow-running-insecure-content --enable-automation';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true
                };
                sinon.stub(State, 'getPort').callsFake(async () => Promise.resolve(9000));
                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();

                const sut = await testRunner.getBrowser(Configuration.application.frameworkConfig.defaultBrowser);
                expect(sut).to.eql(expectedCommand);
            });

            it('should be able to get a browser command from config when running headlessly', async () => {
                const expectedCommand = 'PhantomJS:headless --example-argument --new-argument --headless-args --foobar';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true
                };

                testRunner = new TestRunner(options);
                testRunner.project.browsers.push(<Browser>{
                    'name': 'PhantomJS',
                    'headlessCommand': ' --example-argument --new-argument --headless-args --foobar'
                });

                testRunner.runner = TestCafeRunnerStub.create();

                const sut = await testRunner.getBrowser('PhantomJS');
                expect(sut).to.eql(expectedCommand);
            });

            it('should be able to get a browser command from config when not running headlessly', async () => {
                const expectedCommand = 'PhantomJS --example-argument --new-argument';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: false
                };

                testRunner = new TestRunner(options);
                testRunner.project.browsers.push(<Browser>{
                    'name': 'PhantomJS',
                    'command': ' --example-argument --new-argument'
                });

                testRunner.runner = TestCafeRunnerStub.create();

                const sut = await testRunner.getBrowser('PhantomJS');
                expect(sut).to.eql(expectedCommand);
            });

            it('should be able to use a browser where no command has been set in config', async () => {
                const expectedCommand = 'hedge';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: false
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();

                const sut = await testRunner.getBrowser(expectedCommand);
                expect(sut).to.eql(expectedCommand);
            });

            it('should be able to use a headless browser where no command has been set in config', async () => {
                const expectedCommand = 'hedge';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();

                const sut = await testRunner.getBrowser(expectedCommand);
                expect(sut).to.eql(`${expectedCommand}:headless`);
            });
        });

        describe('Initializing TestRunner', () => {
            it('Should attempt to load the SSL certificates', async () => {
                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();
                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const configurationStub = sandbox.stub(testRunner, 'applyArgumentSpecificConfig');
                configurationStub.callsFake(() => { return; });
                apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                apiTestStub.callsFake(() => { return Promise.resolve(); });

                const sslSpy = sandbox.spy(testRunner, 'sslSettingsWereSet');

                await testRunner.run();

                sinon.assert.calledOnce(sslSpy);
            });

            it('Should exit if there was an error reading the ssl files', async () => {
                const expectedErrorMessage = 'Couldn\'t load the SSL configuration';
                const expectedErrorReason = 'File could not be found';
                const expectedErrorCode = -1;

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();
                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const configurationStub = sandbox.stub(testRunner, 'applyArgumentSpecificConfig');
                configurationStub.callsFake(() => { return; });
                apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                apiTestStub.callsFake(() => { return Promise.resolve(); });

                const sslSpy = sandbox.spy(testRunner, 'sslSettingsWereSet');
                const sslAttemptStub = sandbox.stub(testRunner, 'attemptApplyingSslSettings');

                const consoleErrorStub = sandbox.stub(console, 'error');
                consoleErrorStub.callsFake(() => { return; });

                sslAttemptStub.callsFake(() => {
                    throw new Error(expectedErrorReason);
                });

                await testRunner.run();

                sinon.assert.calledOnce(sslSpy);
                sinon.assert.calledOnce(sslAttemptStub);

                const firstMessage = consoleErrorStub.getCall(0).args[0];
                const secondMessage = consoleErrorStub.getCall(1).args[0].toString();

                expect(firstMessage).to.eql(expectedErrorMessage);
                expect(secondMessage).to.eql(`Error: ${expectedErrorReason}`);

                sinon.assert.calledOnceWithMatch(exitStub, expectedErrorCode);

            });
        });

        describe('Configuring TestCafe', () => {
            describe('Defaults', () => {
                it('Should call the expected default runner methods', async () => {
                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true
                    };

                    testRunner = new TestRunner(options);
                    const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                    const timestampFolder = moment().utc().format(expectedDateFormat);

                    const momentStub = sandbox.stub(moment.fn, 'format');
                    momentStub.callsFake(() => timestampFolder);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const configurationStub = sandbox.stub(testRunner, 'applyArgumentSpecificConfig');
                    configurationStub.callsFake(() => { return; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    await assertConfigureTestRunnerWorks(timestampFolder, sandbox, testRunner);
                });
            });

            describe('Configuration files and Command Line arguments', () => {
                it('Should be configured to save the report to a file when --saveReport has been provided', async () => {
                    const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                    const timestampFolder = moment().utc().format(expectedDateFormat);
                    const expectedReportType = 'xunit';
                    const expectedReportName = `Reports/${timestampFolder}/report.unit-testing.all.browser-chrome.xml`;

                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        saveReport: true
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();

                    const momentStub = sandbox.stub(moment.fn, 'format');
                    momentStub.callsFake(() => timestampFolder);

                    const reporterStub = sandbox.stub(testRunner.runner, 'reporter');
                    reporterStub.callsFake(() => { return testRunner.runner; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.calledOnceWithMatch(reporterStub, [{ name: expectedReportType, output: expectedReportName }]);
                });

                it('Should not be configured to save the report to a file when --saveReport has not been provided', async () => {
                    const expectedReportType = 'xunit';

                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        saveReport: false
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const reporterStub = sandbox.stub(testRunner.runner, 'reporter');
                    reporterStub.callsFake(() => { return testRunner.runner; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.calledOnceWithMatch(reporterStub, [expectedReportType]);
                });

                it('Should set the expected client scripts when --debug has been provided', async () => {
                    const expectedScript = 'snoopy.js';

                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        debug: true
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const scriptsStub = sandbox.stub(testRunner.runner, 'clientScripts');
                    scriptsStub.callsFake(() => { return; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    sandbox.stub(State, 'log').callsFake(() => { return; });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.calledOnce(scriptsStub);
                    const scriptsCall = scriptsStub.getCall(0).args[0];
                    expect(scriptsCall[0].path).to.contain(expectedScript);
                });

                it('Should not set any client scripts when --debug has not been provided', async () => {
                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        debug: false
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const scriptsStub = sandbox.stub(testRunner.runner, 'clientScripts');
                    scriptsStub.callsFake(() => { return; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.notCalled(scriptsStub);
                });

                it('Should be set to filter tests when --filterTests has been provided', async () => {
                    const expectedFilter = 'fixtureName=\'(.*)Foo(.*)\'';
                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        debug: false,
                        filterTest: expectedFilter
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const filterStub = sandbox.stub(testRunner.runner, 'filterTest');
                    filterStub.callsFake(() => { return testRunner.runner; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.calledOnceWithMatch(filterStub, expectedFilter);
                });

                it('Should not filter tests when --filterTests has not been provided', async () => {
                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        debug: false
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const filterStub = sandbox.stub(testRunner.runner, 'filterTest');
                    filterStub.callsFake(() => { return testRunner.runner; });
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.notCalled(filterStub);
                });

                describe('Running on multiple threads', () => {
                    const runs = [2, 4, 8, 16, 32];

                    runs.forEach(run => {
                        it(`should be set up to run on multiple threads when parallel threads is set to ${run}`, async () => {
                            Configuration.application.frameworkConfig.parallelThreads = run;
                            const options: FrameworkArguments = {
                                product: Configuration.product,
                                environment: Configuration.environment,
                                headless: true,
                                debug: false
                            };

                            testRunner = new TestRunner(options);
                            testRunner.runner = TestCafeRunnerStub.create();
                            const concurrencyStub = sandbox.stub(testRunner.runner, 'concurrency');
                            concurrencyStub.callsFake(() => { return testRunner.runner; });
                            apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                            apiTestStub.callsFake(() => { return Promise.resolve(); });

                            const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                            createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                            const runnerStub = sandbox.stub(testRunner.runner, 'run');
                            runnerStub.returns(Promise.resolve(0));
                            const createStub = sandbox.stub(testRunner, 'createRunner');
                            createStub.returns(testRunner.runner);

                            await testRunner.run();

                            sinon.assert.calledOnceWithMatch(concurrencyStub, run);
                        });
                    });
                });

                it('Should not be set to run on multiple threads when parallel threads is equal to 1', async () => {
                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        debug: false
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const concurrencyStub = sandbox.stub(testRunner.runner, 'concurrency');
                    concurrencyStub.callsFake(() => { return testRunner.runner; });
                    const reporterStub = sandbox.stub(testRunner.runner, 'reporter');
                    reporterStub.callsFake(() => { return testRunner.runner; });

                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(0));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.notCalled(concurrencyStub);
                });

                it('Should be able to run with minimal configuration', async () => {
                    const expectedReportType = 'xunit';
                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true
                    };

                    testRunner = new TestRunner(options);
                    testRunner.runner = TestCafeRunnerStub.create();
                    const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                    const timestampFolder = moment().utc().format(expectedDateFormat);

                    const momentStub = sandbox.stub(moment.fn, 'format');
                    momentStub.callsFake(() => timestampFolder);
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });
                    const concurrencyStub = sandbox.stub(testRunner.runner, 'concurrency');
                    concurrencyStub.callsFake(() => { return testRunner.runner; });
                    const filterStub = sandbox.stub(testRunner.runner, 'filterTest');
                    filterStub.callsFake(() => { return testRunner.runner; });
                    const reporterStub = sandbox.stub(testRunner.runner, 'reporter');
                    reporterStub.callsFake(() => { return testRunner.runner; });
                    const scriptsStub = sandbox.stub(testRunner.runner, 'clientScripts');
                    scriptsStub.callsFake(() => { return; });

                    await assertConfigureTestRunnerWorks(timestampFolder, sandbox, testRunner);

                    sinon.assert.calledOnceWithMatch(reporterStub, [expectedReportType]);
                    sinon.assert.notCalled(scriptsStub);
                    sinon.assert.notCalled(filterStub);
                    sinon.assert.notCalled(concurrencyStub);
                });

                it('Should be able to run with a complex configuration', async () => {
                    const expectedReportType = 'xunit';
                    const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                    const timestampFolder = moment().utc().format(expectedDateFormat);
                    const expectedReportName = `Reports/${timestampFolder}/report.unit-testing.all.browser-chrome.xml`;
                    const expectedFilter = 'fixtureName=\'(.*)Foo(.*)\'';

                    const options: FrameworkArguments = {
                        product: Configuration.product,
                        environment: Configuration.environment,
                        headless: true,
                        saveReport: true,
                        debug: true,
                        filterTest: expectedFilter
                    };
                    const expectedThreads = 4;
                    const expectedScript = 'snoopy.js';

                    Configuration.application.frameworkConfig.parallelThreads = expectedThreads;

                    testRunner = new TestRunner(options);

                    const momentStub = sandbox.stub(moment.fn, 'format');
                    momentStub.callsFake(() => timestampFolder);
                    testRunner.runner = TestCafeRunnerStub.create();
                    apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                    apiTestStub.callsFake(() => { return Promise.resolve(); });

                    sandbox.stub(State, 'log').callsFake(() => { return; });
                    const concurrencyStub = sandbox.stub(testRunner.runner, 'concurrency');
                    concurrencyStub.callsFake(() => { return testRunner.runner; });
                    const filterStub = sandbox.stub(testRunner.runner, 'filterTest');
                    filterStub.callsFake(() => { return testRunner.runner; });
                    const reporterStub = sandbox.stub(testRunner.runner, 'reporter');
                    reporterStub.callsFake(() => { return testRunner.runner; });
                    const scriptsStub = sandbox.stub(testRunner.runner, 'clientScripts');
                    scriptsStub.callsFake(() => { return; });

                    await assertConfigureTestRunnerWorks(timestampFolder, sandbox, testRunner);

                    sinon.assert.calledOnceWithMatch(reporterStub, [{ name: expectedReportType, output: expectedReportName }]);
                    sinon.assert.calledOnce(scriptsStub);
                    const scriptsCall = scriptsStub.getCall(0).args[0];
                    expect(scriptsCall[0].path).to.contain(expectedScript);
                    sinon.assert.calledOnceWithMatch(filterStub, expectedFilter);
                    sinon.assert.calledOnceWithMatch(concurrencyStub, expectedThreads);
                });
            });
        });

        describe('Sources', () => {
            it('Should be able to retrieve the browser source locations', () => {
                const expected: string[] = [
                    './dist/framework/timespan/timespan.js',
                    './dist/products/unit-testing/steps/hp/**/*.steps.js',
                    './dist/products/unit-testing/specs/hp/**/*.spec.feature'
                ];

                const sut = testRunner.getBrowserTestFiles();

                expect(sut).to.eql(expected);
            });
        });

        describe('Browser reports', () => {
            it('Should be able to determine the name of the browser report correctly when a default browser is used', async () => {
                const expectedBrowser = 'chrome';
                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true,
                    saveReport: true
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();
                apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                apiTestStub.callsFake(() => { return Promise.resolve(); });

                await assertTheCorrectBrowserReportSet(expectedBrowser, sandbox, testRunner, exitStub);
            });

            it('Should be able to determine the name of the browser report correctly when the CLI argument is provided', async () => {
                const expectedBrowser = 'firefox';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true,
                    browser: expectedBrowser,
                    saveReport: true
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();
                apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                apiTestStub.callsFake(() => { return Promise.resolve(); });

                await assertTheCorrectBrowserReportSet(expectedBrowser, sandbox, testRunner, exitStub);
            });
        });

        describe('Completing Initialization', () => {
            it('Should attempt to save the log file', async () => {
                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const saveLogStub = sandbox.stub(State, 'saveLogFile');
                saveLogStub.callsFake(() => { return Promise.resolve(); });

                await testRunner.run();

                sinon.assert.calledOnce(saveLogStub);
            });

            it('Should use the correct file name format', () => {
                const expectedBrowser = 'chrome';
                const expectedDate = (moment().toISOString()).toString();
                const expectedFilename = `${expectedDate}_init_chrome`;
                const expectedFileExtension = '.txt';
                const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
                const timestampFolder = moment().utc().format(expectedDateFormat);
                const expectedReportsDirectory = `./Reports/${timestampFolder}/init`;

                const momentStub = sandbox.stub(moment.fn, 'toISOString');
                momentStub.callsFake(() => timestampFolder);

                momentStub.callsFake(() => expectedDate);
                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const saveLogStub = sandbox.stub(State, 'saveLogFile');
                saveLogStub.callsFake(() => { return Promise.resolve(); });

                testRunner.completeInit(expectedBrowser);
                sinon.assert.calledOnce(momentStub);
                sinon.assert.calledOnceWithExactly(saveLogStub, expectedReportsDirectory, expectedFilename, expectedFileExtension);
            });

            it('Should log an error if there was an error saving the file', async () => {
                const expectedErrorReason = 'Couldn\'t save log file';
                const expectedErrorMessage = 'A file with the same name already exists';

                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const consoleErrorStub = sandbox.stub(console, 'error');
                consoleErrorStub.callsFake(() => { return; });
                const saveLogStub = sandbox.stub(State, 'saveLogFile');
                saveLogStub.callsFake(() => {
                    return Promise.reject(new Error(expectedErrorMessage));
                });

                await testRunner.run();

                sinon.assert.calledOnce(saveLogStub);
                expect(consoleErrorStub.getCall(0).args[0]).to.eql(expectedErrorReason);
                expect(consoleErrorStub.getCall(1).args[0].toString()).to.eql(`Error: ${expectedErrorMessage}`);
            });

            it('Should set the current browser to the default browser if none were provided', async () => {
                const expectedBrowser = 'chrome';

                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const saveLogStub = sandbox.stub(State, 'saveLogFile');
                saveLogStub.callsFake(() => { return Promise.resolve(); });

                await testRunner.run();

                expect(State.currentBrowser).to.eql(expectedBrowser);
            });

            it('Should set the current browser to the provided browser if the argument was provided', async () => {
                const expectedBrowser = 'firefox';

                const options: FrameworkArguments = {
                    product: Configuration.product,
                    environment: Configuration.environment,
                    headless: true,
                    browser: expectedBrowser
                };

                testRunner = new TestRunner(options);
                testRunner.runner = TestCafeRunnerStub.create();
                apiTestStub = sandbox.stub(testRunner, 'runApiTests');
                apiTestStub.callsFake(() => { return Promise.resolve(); });

                const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                const runnerStub = sandbox.stub(testRunner.runner, 'run');
                runnerStub.returns(Promise.resolve(0));
                const createStub = sandbox.stub(testRunner, 'createRunner');
                createStub.returns(testRunner.runner);
                const saveLogStub = sandbox.stub(State, 'saveLogFile');
                saveLogStub.callsFake(() => { return Promise.resolve(); });

                await testRunner.run();

                expect(State.currentBrowser).to.eql(expectedBrowser);
            });
        });

        describe('Test Failures', () => {
            const runs = [
                { testFailures: 0, expectedErrorCode: 0 },
                { testFailures: 1, expectedErrorCode: -1 },
                { testFailures: 23, expectedErrorCode: -1 },
                { testFailures: 42, expectedErrorCode: -1 },
            ];

            runs.forEach((run) => {
                it(`Should exit with code ${run.expectedErrorCode} if ${run.testFailures} test failures occurred`, async () => {
                    const expectedErrorCode = run.expectedErrorCode;

                    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
                    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
                    const runnerStub = sandbox.stub(testRunner.runner, 'run');
                    runnerStub.returns(Promise.resolve(run.testFailures));
                    const createStub = sandbox.stub(testRunner, 'createRunner');
                    createStub.returns(testRunner.runner);

                    await testRunner.run();

                    sinon.assert.calledOnce(exitStub);
                    sinon.assert.calledWith(exitStub, expectedErrorCode);
                    const testFailMessage = consoleStub.getCall(1).args[0];
                    expect(testFailMessage).to.eql(`Tests failed: ${run.testFailures}`);
                });
            });
        });
    });
});

async function assertConfigureTestRunnerWorks(timestampFolder: string, sandbox: sinon.SinonSandbox, testRunner: TestRunner) {
    TestRunner.reportsFolder = `Reports/${timestampFolder}`;

    const expectedLocations: string[] = [
        './dist/framework/timespan/timespan.js',
        './dist/products/unit-testing/steps/hp/**/*.steps.js',
        './dist/products/unit-testing/specs/hp/**/*.spec.feature'
    ];

    const expectedTags = ['~@Ignore', '~@AnotherTagToIgnore', '~@Amet'];
    const expectedBrowser = 'chrome';
    const expectedVideoFolder = `Reports/${timestampFolder}/videos/`;
    const expectedVideoOptions = { singleFile: false, failedOnly: true };
    const expectedScreenshotOptions = { path: `Reports/${timestampFolder}/screenshots/`, takeOnFails: true };

    const srcStub = sandbox.stub(testRunner.runner, 'src');
    srcStub.callsFake(() => { return testRunner.runner; });
    const tagsStub = sandbox.stub(testRunner.runner, 'tags');
    tagsStub.callsFake(() => { return testRunner.runner; });
    const browsersStub = sandbox.stub(testRunner.runner, 'browsers');
    browsersStub.callsFake(() => { return testRunner.runner; });
    const videoStub = sandbox.stub(testRunner.runner, 'video');
    videoStub.callsFake(() => { return testRunner.runner; });
    const screenshotStub = sandbox.stub(testRunner.runner, 'screenshots');
    screenshotStub.callsFake(() => { return testRunner.runner; });

    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
    const runnerStub = sandbox.stub(testRunner.runner, 'run');
    runnerStub.returns(Promise.resolve(0));
    const createStub = sandbox.stub(testRunner, 'createRunner');
    createStub.returns(testRunner.runner);

    await testRunner.run();

    sinon.assert.calledOnceWithMatch(srcStub, expectedLocations);
    sinon.assert.calledOnceWithMatch(tagsStub, expectedTags);
    sinon.assert.calledOnceWithMatch(browsersStub, expectedBrowser);
    sinon.assert.calledOnceWithMatch(videoStub, expectedVideoFolder, expectedVideoOptions);
    sinon.assert.calledOnceWithMatch(screenshotStub, expectedScreenshotOptions);
}

async function assertTheCorrectBrowserReportSet(expectedBrowser: string, sandbox: sinon.SinonSandbox, testRunner: TestRunner, exitStub: sinon.SinonStub) {
    const expectedReportType = `browser-${expectedBrowser}`;
    const expectedDateFormat = 'YYYY-MM-DD_HH-mm-ss';
    const timestampFolder = moment().utc().format(expectedDateFormat);
    TestRunner.reportsFolder = `Reports/${timestampFolder}`;
    const expectedReportLocation = `Reports/${timestampFolder}/report.unit-testing.all.${expectedReportType}.xml`;

    const momentStub = sandbox.stub(moment.fn, 'format');
    momentStub.callsFake(() => timestampFolder);

    const createInstanceStub = sandbox.stub(testRunner, 'createInstance');
    createInstanceStub.returns(Promise.resolve(<TestCafeInstance>{}));
    const runnerStub = sandbox.stub(testRunner.runner, 'run');
    runnerStub.returns(Promise.resolve(0));
    const createStub = sandbox.stub(testRunner, 'createRunner');
    createStub.returns(testRunner.runner);
    const sut = sandbox.spy(TestRunner, 'getReportFileName');


    await testRunner.run();

    // sinon.assert.alwaysCalledWith(sut, expectedReportType);
    sinon.assert.calledOnce(sut);
    expect(sut.getCall(0).returnValue).to.eql(expectedReportLocation);
    sinon.assert.calledOnce(exitStub);
}
