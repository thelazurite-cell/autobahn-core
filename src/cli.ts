/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/*
 * cli.ts

 * 
 * When the framework initially runs, perform any checks of the incomming parameters provided
 * and run the specified functionality.
 */
'use strict';
import { TestRunner } from './test-runner';
import { ServerLoggerSingleton } from './framework/logging/client-logger/server';
import { Configuration } from './framework/configuration/configuration';
import { State } from './framework/logging/state';
import { FrameworkArguments } from './framework-arguments';
import { hideBin } from 'yargs/helpers';
import { GeneratorCli } from './framework/generator/generator-cli';
import { setPriority } from 'os';
import yargs from 'yargs/yargs';
import conf = require('./framework/framework.config');

const highestPriority = -20;
State.platform = process.platform;

if (State.platform === 'win32') {
    setPriority(process.pid, highestPriority);
}

process.title = 'Autobahn Test Framework';

yargs(hideBin(process.argv))
    .command('generate', 'generates the specified item type', (_yargs) => {
        //
    }, async (_argv) => {
        await new GeneratorCli().run();
    })
    .command('run', 'start a test run with the specified parameters', (yargs) => {
        yargs.demandOption('product', 'The product must be provided')
            .describe('product', 'Set product to run automated tests against')
            .alias('p', 'product');

        yargs.demandOption('environment', 'The environment must be provided')
            .describe('environment', 'Set product environment to use')
            .alias('e', 'environment');

        yargs.option('headless', {
            alias: 'h',
            type: 'boolean',
            description: 'Run the browser in headless mode'
        });

        yargs.option('cache', {
            alias: 'b',
            type: 'boolean',
            description: 'Sets whether browser caching should be used',
            default: false
        });

        yargs.option('retry-test-pages', {
            type: 'boolean',
            description: 'If this option is enabled, TestCafe retries failed network requests for webpages visited during tests. The retry functionality is limited to ten tries.',
            default: true
        });

        yargs.option('pt', {
            alias: 'c',
            type: 'number',
            description: 'Sets number of concurrent threads to run the tests with'
        });

        yargs.option('saveReport', {
            alias: 's',
            type: 'boolean',
            description: 'Saves the configured report types as files'
        });

        yargs.option('browserReports', {
            alias: 'r',
            type: 'string',
            description: 'Overrides the configiured browser reports'
        });

        yargs.option('tags', {
            alias: 't',
            type: 'string',
            description: 'Sets tags to use for the test run. Each tag should be separated with a "|"'
        });

        yargs.option('browser', {
            type: 'string',
            description: `Sets the browser(s) to use for the test run.
             If one hasn't been provided then the default browser from the application configuration will be used instead.
             Multiple browser values can be provided if values are separated with a "|"`
        });

        yargs.option('filterTest', {
            alias: 'f',
            type: 'string',
            description: `Sets the filter to use for the test run.
            You can provide a fixtureName (Feature name) and/or testName (Scenario/Scenario outline name) regexp.
            If providing both separate values with a "|"`,
        });

        yargs.option('pipeline', {
            alias: 'l',
            type: 'boolean',
            description: `Sets a flag to state whether the framework is being run on a build server. if provided you must set the '--testHost'.`
        });

        yargs.option('useSsl', {
            type: 'boolean',
            description: `Sets a flag to determine whether the application under test uses SSL.
            You can only provide this value if you provide '--pipeline'`
        });

        yargs.option('testHost', {
            alias: 'w',
            type: 'string',
            description: `Sets the host name for the application under test. 
            You should not provide 'http(s)://' or a page path. 
            You can only provide this value if you provide '--pipeline'`
        });

        yargs.option('applicationRoot', {
            alias: 'o',
            type: 'string',
            description: `Sets the application root for the application currently being tested.
             This should be the page path that comes after the host name.
             You can only provide this value if you provide '--pipeline'`
        });

        yargs.option('debug', {
            alias: 'd',
            type: 'boolean',
            description: 'Run with verbose logging'
        });

    }, async (argv) => {
        conf.args = argv as unknown as FrameworkArguments;
        Configuration.product = conf.args.product;
        Configuration.environment = conf.args.environment;
        if (argv.debug) {
            ServerLoggerSingleton.initializeServerLogger().then(() => {
                console.log('Logger initialized');
            });
        }

        try {
            await new TestRunner(conf.args).run();
        } catch (e) {
            console.error(e);
            process.exit(-1);
        }
    })
    .argv;