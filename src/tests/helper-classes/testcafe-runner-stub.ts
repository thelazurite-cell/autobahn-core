/* eslint-disable @typescript-eslint/no-unused-vars */
// The unused variables have been ignored as they describe the stubbed class.
import { Runner } from '../../framework/gherkin/runner';

export class TestCafeRunnerStub {
    public static create(): Runner {
        return {
            /***
             * Sources testcafe should use for running the tests. 
             * @param sourceFiles - states which source files the framework should look at
             */
            src: (sourceFiles: string[]): Runner => { return TestCafeRunnerStub.create(); },
            /***
             * @param allowedTags tell the framework what tags should run. Each tag should be separated by a comma (,)
             */
            tags: (allowedTags: string[]): Runner => { return TestCafeRunnerStub.create(); },

            /***
            * Tells the framework which browsers to use
            * @param browsers What browsers should be used. Supports multiple running at the same time, however is generally set up 
            * to run each one separately. 
            */
            browsers: (browsers: string): Runner => { return TestCafeRunnerStub.create(); },

            /***
             * @param path where the video will be stored.
             * @param config configures when a video should be taken
             */
            video: (path: string, config: {
                singleFile: boolean;
                failedOnly: boolean;
            }): Runner => { return TestCafeRunnerStub.create(); },
            screenshots: (config: {
                path: string;
                takeOnFails: boolean;
            }): Runner => { return TestCafeRunnerStub.create(); },
            generate: (inputFile: string, outputFile: string, append: boolean, silent: boolean): Runner => { return TestCafeRunnerStub.create(); },
            clientScripts: () => { return; },
            run: () => { return; },
            filterTest: () => { return; },
            reporter: (a: string, b?: string) => { return TestCafeRunnerStub.create(); },
            concurrency: () => { return; }
        } as unknown as Runner;
    }
}