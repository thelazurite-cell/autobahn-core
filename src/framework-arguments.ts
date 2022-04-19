/**
 * The @typeof FrameworkArguments that can be sent to the CLI. Each parameter must be typed as displayed below,
 * and prefixed with --
 */
export class FrameworkArguments {
    generateNew?: boolean;
    /**
     * Sets the product that should be tested, or that step definitions should be generated against.
     * This value must be provided.
     */
    product: string;

    /**
     * Sets the product environment. This value must be provided. 
     */
    environment: string;

    /**
     * Which browser should be used? If one hasn't been provided then the default browser from the application
     * configuration will be used instead. Multiple browser values can be provided if separated by |
     */
    browser?: string;

    /**
     * Sets a value indicating whether the browser should be loaded in healdless mode or not.
     */
    headless?: boolean;

    /**
     * Sets the URL that the framework should load as, defaults to localhost if not provided.
     */
    url?: string;

    /**
     * sets a value indicating whether a report should be saved as a file. 
     * if set to false (not provided), then it will be displayed in the console instead.
     */
    saveReport?: boolean;

    /**
     * sets a value indicating whether debugging mode should be used.
     * When true, extra logging will be available from the browser and test framework.
     */
    debug?: boolean;

    /**
     * tells the framework how to filter the tests from the specified product area. 
     * you can provide a fixtureName (Feature name) and/or testName (Scenario/Scenario outline name)
     * if providing both, separate by |
     */
    filterTest?: string;

    /**
     * tells the framework to filter tests down by the tags provided.
     */
    tags?: string;

    /**
     * sets a value indicating whether step definitions should be generated.
     */
    generate?: boolean;

    /**
     * tells the framework which feature file to look for missing steps in.
     */
    input?: string;

    /**
     * tells the framework which file new steps should be generated in
     */
    output?: string;

    /**
     * sets a value indicating whether the user should be prompted to confirm 
     * steps and allowing the appending of steps to an existing file.
     * If set to true, then the user will not be prompted to confirm.
     */
    silent?: boolean;

    /**
     * Tells the framework to cache the website's resources for faster loading times 
     */
    cache?: boolean;

    /**
     * Override the browser reports within the config
     */
    browserReports?: string;

    /**
     * override the amount of parallel threads to use 
     */
    pt?: number;
}