export type Reporter = string | (string | {
    name: string;
    output: string;
})[];

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Runner = {
    /***
     * Sources testcafe should use for running the tests. 
     * @param sourceFiles - states which source files the framework should look at
     */
    src(sourceFiles: string[]): Runner;

    /***
     * @param allowedTags tell the framework what tags should run. Each tag should be separated by a comma (,)
     */
    tags(allowedTags: string[]): Runner;

    /***
    * Tells the framework which browsers to use
    * @param browsers What browsers should be used. Supports multiple running at the same time, however is generally set up 
    * to run each one separately. 
    */
    browsers(browsers: string): Runner;

    /***
     * @param path where the video will be stored.
     * @param config configures when a video should be taken
     */
    video(path: string, config: {
        singleFile: boolean;
        failedOnly: boolean;
    }): Runner;

    /***
     * @param config tells the framework when to take a screenshot
     */
    screenshots(config: {
        path: string;
        takeOnFails: boolean;
        fullPage?: boolean;
    }): Runner;

    /***
     * Tells the framework how to report on test failures
     * @param reportType the type of report to be generated (i.e xunit, spec, etc.)
     * @param outputFile where the report should be stored.
     */
    reporter(reportType: Reporter, outputFile?: string): Runner;
    /**
    * Tells the framework to generate missing step definitions from a provided file.
    * @param inputFile the file to check which step definitions are missing
    * @param outputFile where the step definitions should be stored
    * @param append if the step defintion (output file) exists, append should be true.
    * @param silent if set to true, then the generation process will add all missing definitions to the output file,
    * if false then each definition will need to be confirmed. Along with this, you will be asked to confirm if you 
    * would like to append any new steps if the step definition file exists. 
    */
    generate(inputFile: string, outputFile: string, append: boolean, silent: boolean): Runner;

    /***
     * Loads scripts to be used by the client/browser. 
     * @param paths the location of the scripts to be loaded
     */
    clientScripts: (paths: {
        path: string;
    }[]) => void;

    /***
     * filters the tests by the provided filter parameters. each parameter must be separated by a '|'
     */
    filterTest: (filter: string) => Runner;

    concurrency: (arg0: number) => Runner;
    retryTestPages: () => Runner;
    cache: () => Runner;
    configFile: (path: string) => Runner;

    /***
     * Run the test framework
     */
    run: (...args: any) => any;
};