import { Sources } from './sources';

/*
* framework-settings.ts

 */
export class FrameworkSettings {
    /***
     * Sets the expected wait time in miliseconds for page load wait times out.
     */

    public pageLoadTimeoutMs: number = 0;
    /**
     * overrides the default page request timeout for testcafe
     */
    public pageRequestTimeout: number = 0;

    /***
     * Sets the expected wait time in miliseconds for an ajax request 
     */
    public ajaxTimeoutMs: number = 0;

    /***
     * Sets the expected wait time for a selector/element search 
     */
    public defaultElementTimeoutMs: number = 0;

    /***
     * Sets the expected wait time for an assertion
     */
    public assertionTimeoutMs: number = 0;

    /***
     * Sets the sources to compile at runtime before the tests can run.
     */
    public sources: Sources[];

    /**
     * Mocha reporters to use when running api tests.
     */
    public mochaReporters: string = '';

    /***
     * Sets the format of the report output from testcafe
     *  i.e. spec, xunit, etc.
     */
    public testcafeReporters: string = '';

    /***
     * If an argument for the browser hasn't been provided, then by default this browser will be used.
     */
    public defaultBrowser: string = '';

    /***
     * Sets the amount of parallel/concurrent sessions to run at the same time. the way the framework has been set up
     * means that it will only target one browser type.
     */
    public parallelThreads: number = 1;

    /***
     * Sets how fast the tests should run, with 1 being fastest and 0.1 being the slowest.
     */
    public testSpeed: number = 1;

    /***
     * Sets the max amount of attempts for a test. 
     * i.e. 1 - run once, ignore test failure and continue,
     *  2+ - run the test again if it fails.
     */
    public maxTestAttempts: number = 1;

    /**
     * Overrides the downloads path to use by the framework, by default this option is not recommended unless
     * absoloutely necessary.
     */
    public downloadsPath?: string;
}
