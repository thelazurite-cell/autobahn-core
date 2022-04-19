/*
 * config-singleton.ts

 */
import { AppConfiguration } from './app-configuration';
import { readFileSync } from 'fs';
import { FrameworkTestConfiguration } from './framework-test-configuration';
import { TestConfigurationItem } from './test-configuration-item';
import { AcceptanceCriteria } from './acceptance-criteria';
import { AcceptanceCriteriaItem } from './acceptance-criteria-item';
import { Dictionary } from '../helpers/dictionary';
import path from 'path';
import fs from 'fs';
import { FrameworkSettings } from './framework-settings';
import { EnumHelper } from '../helpers/enum-helper';
import { SourcesType } from './sources-type.enum';

export type ConfigTree = { [x: string]: Record<string, string> | string; } | string[];

export class Configuration {
    /**
     * The application configuration
     */
    private static _config: AppConfiguration | null = null;
    /**
     * The framework test configuration
     */
    private static _testConfig: FrameworkTestConfiguration | null = null;

    /**
     * Gets or sets the product name to use to fetch the configuration.
     */
    public static product = '';

    /**
     * Gets or sets the environment to use to fetch the configuration.
     */
    public static environment = '';

    /**
     * Gets or sets a value indicating whether a registry lookup on the win32 for the downloads folder
     * should be performed. Set to false if you are having issues running the framwork.
     */
    public static ignoresRegistry = false;

    /**
     * Gets the application configuration
     */
    public static get application(): AppConfiguration {
        if (!this._config) {
            Configuration._config = this.initializeAppConfig();
        }

        if (this._config)
            return Configuration._config;
        throw Error('Couldn\'t read the application configuration');
    }

    /**
     * Gets the test configuration
     */
    public static get tests(): FrameworkTestConfiguration {
        if (!this._testConfig) {
            Configuration._testConfig = this.initializeTestConfig();
        }

        if (this._testConfig)
            return this._testConfig;
        throw Error('Couldn\'t read the test configuration');
    }

    /**
     * Reinitializes both the application and test configurations
     * @param [useFallback] use if the fallback option for the test configuration should be used
     */
    public static reinitialize(useFallback: boolean = false, getEnvVariables: boolean = true): void {
        Configuration._config = this.initializeAppConfig(getEnvVariables);
        Configuration._testConfig = this.initializeTestConfig(useFallback);
    }

    /**
     * Initializes the application configuration
     *  - first, read the file, and ensure the correct types are used
     *  - validate that the syntax for application is being followed
     * @returns the application configuration
     */
    private static initializeAppConfig(getEnvVariables: boolean = true): AppConfiguration {
        const config = this.readFile(path.join(process.cwd(), 'config', this.product.split('.')[0], `appConfig.${this.product}.${this.environment}.json`));
        const envConfig = getEnvVariables ? this.getEnvAppConfig(config) : config;
        const typedConfig = Configuration.ensureAppConfigTypes(envConfig);

        Configuration.validateApplicationConfiguration(typedConfig);
        return typedConfig;
    }

    /**
     * Gets appConfig override values from environment variables.
     * 
     * @param jsonConfig 
     */
    private static getEnvAppConfig(jsonConfig: ConfigTree): ConfigTree {
        for (const propertyName in jsonConfig) {
            const jsonValue = jsonConfig[propertyName];
            if (typeof jsonValue === 'object') {
                jsonConfig[propertyName] = this.getEnvAppConfig(jsonValue);
            }

            const envVar = (`appconfig_${propertyName}`).toUpperCase();
            const envValue = process.env[envVar];
            if (envValue !== undefined) {
                jsonConfig[propertyName] = envValue;
            } else {
                jsonConfig[propertyName] = jsonValue;
            }
        }

        return jsonConfig;
    }

    /**
     * Ensures that the correct types are being used for the application configuration
     * @param config - the unknown configuration type after being read from the file
     * @returns the typed application configuration
     */
    private static ensureAppConfigTypes(config: unknown): AppConfiguration {
        const typedConfig = new AppConfiguration();
        Object.assign(typedConfig, config);

        Configuration.setAppConfigTypes(typedConfig);
        return typedConfig;
    }

    /**
     * Sets the correct application configuration types as long as they were initially present
     * @param typedConfig - the current application configuration
     */
    private static setAppConfigTypes(typedConfig: AppConfiguration): void {
        if (typedConfig.dataConnections) {
            Configuration.setDataConnections(typedConfig);
        }

        if (typedConfig.details) {
            Configuration.setApplicationDetails(typedConfig);
        }

        if (typedConfig.frameworkConfig) {
            Configuration.setFrameworkConfig(typedConfig);
        }
    }

    /**
     * Sets the type for the application details
     * @param typedConfig the current application configuration
     */
    private static setApplicationDetails(typedConfig: AppConfiguration): void {
        const applicationConfig = typedConfig.details;
        const typedApplicationConfig = new Dictionary();
        Object.assign(typedApplicationConfig, applicationConfig);
        typedConfig.details = typedApplicationConfig;
    }

    /**
     * Sets the type for the data connections
     * @param typedConfig the current application configuration
     */
    private static setDataConnections(typedConfig: AppConfiguration): void {
        const dataConnections = typedConfig.dataConnections;
        const typedDataConnections = new Dictionary();
        Object.assign(typedDataConnections, dataConnections);
        typedConfig.dataConnections = typedDataConnections;
    }

    /**
     * Sets the type for the framework configuration
     * @param typedConfig the current application configuration
     */
    private static setFrameworkConfig(typedConfig: AppConfiguration): void {
        const frameworkSettings = typedConfig.frameworkConfig;
        const typedFrameworkSettings = new FrameworkSettings();
        Object.assign(typedFrameworkSettings, frameworkSettings);
        typedConfig.frameworkConfig = typedFrameworkSettings;
    }

    /**
     * Validates the application configuration by: 
     *  - ensuring the framework testing values are within their expected ranges
     *  - ensuring the framework timeouts are valid numbers
     *  - ensure that the framework behaviour has been set correctly
     * @param configType the current application configuration
     */
    private static validateApplicationConfiguration(configType: AppConfiguration): void {
        Configuration.validateFrameworkTesting(configType);
        Configuration.validateFrameworkTimeouts(configType);
        Configuration.validateFrameworkBehaviour(configType);
    }

    /**
     * Validates framework testing values are within their expected ranges
     * @param configType the current application configuration
     */
    private static validateFrameworkTesting(configType: AppConfiguration): void {
        if (!configType.frameworkConfig) {
            throw new Error('Application configuration should contain the framework configuration element');
        }

        if (!configType.frameworkConfig.sources) {
            throw new Error('Application Configuration must contain a sources array');
        } else if (configType.frameworkConfig.sources.length === 0) {
            throw new Error('The sources array must contain at least one element');
        }

        Configuration.validateEachSource(configType);
    }

    /**
     * Validates that each source item within the sources array are within the expected ranges
     * @param configType the current application configuration
     */
    private static validateEachSource(configType: AppConfiguration) {
        for (const item of configType.frameworkConfig.sources) {
            if (!item.type || item.type.toString().trim() === '') {
                throw new Error('Sources item must contain a type');
            } else if (!item.locations || item.locations.length === 0) {
                throw new Error('The sources array must contain at least one element');
            }

            if (!EnumHelper.TryParse(SourcesType, item.type.toString())) {
                throw new Error('The sources type is invalid');
            }
        }
    }

    /**
     * Validates that the framework behaviour has been set correctly
     * @param configType the current application configuration
     */
    private static validateFrameworkBehaviour(configType: AppConfiguration) {
        const parallelThreads = configType.frameworkConfig.parallelThreads;
        if (isNaN(parallelThreads) || parallelThreads < 1) {
            throw new Error('Application configuration should have a valid number of parallel threads');
        }

        const applicationTestSpeed = configType.frameworkConfig.testSpeed;
        if (isNaN(applicationTestSpeed) || applicationTestSpeed < 0.01) {
            throw new Error('Application test speed is under the minimum of 0.01');
        } else if (applicationTestSpeed > 1) {
            throw new Error('Application test speed is over the maximum of 1');
        }

        const maxTestAttempts = configType.frameworkConfig.maxTestAttempts;
        if (isNaN(maxTestAttempts) || maxTestAttempts < 1) {
            throw new Error('Application test attempts should be at least 1');
        }

        if ((!configType.frameworkConfig.testcafeReporters || configType.frameworkConfig.testcafeReporters.trim().length === 0)) {
            throw new Error('Application configuration should contain a report type');
        }
    }

    /**
     * Validates that the framework timeouts have been set correctly
     * @param configType the current application configuration
     */
    private static validateFrameworkTimeouts(configType: AppConfiguration) {
        const pageLoadTimeout = configType.frameworkConfig.pageLoadTimeoutMs;
        if (isNaN(pageLoadTimeout) || pageLoadTimeout < 0) {
            throw new Error('Application configuration should contain a vaild page load timeout');
        }

        const ajaxTimeoutMs = configType.frameworkConfig.ajaxTimeoutMs;
        if (isNaN(ajaxTimeoutMs) || ajaxTimeoutMs < 0) {
            throw new Error('Application configuration should contain a valid AJAX timeout');
        }

        const defaultElementTimeoutMs = configType.frameworkConfig.defaultElementTimeoutMs;
        if (isNaN(defaultElementTimeoutMs) || defaultElementTimeoutMs < 0) {
            throw new Error('Application configuration should contain a valid default element timeout');
        }

        const assertionTimeoutMs = configType.frameworkConfig.assertionTimeoutMs;
        if (isNaN(assertionTimeoutMs) || assertionTimeoutMs < 0) {
            throw new Error('Application configuration should contain a valid assertion timeout');
        }
    }

    /**
     * Initializes the test configuration based off the specified configuration to use
     * @param [useFallback] if true, it will default to the default name expected for the product e.g. the root of unit-testing.foo-bar is unit-testing
     * @returns the parsed and validated test configuration 
     */
    private static initializeTestConfig(useFallback: boolean = false): FrameworkTestConfiguration {
        const typedTestConfig = Configuration.getTestConfiguration(useFallback);
        const validatedConfigurationItems: TestConfigurationItem[] = [];

        Configuration.validateTestConfiguration(typedTestConfig, validatedConfigurationItems);

        return Configuration.parseTestConfiguration(typedTestConfig, validatedConfigurationItems);
    }

    private static parseTestConfiguration(typedTestConfig: FrameworkTestConfiguration, validatedConfigurationItems: TestConfigurationItem[]) {
        typedTestConfig.testConfiguration = validatedConfigurationItems;
        typedTestConfig.acceptanceCriteria = Configuration.getAcceptanceCriteriaItems(typedTestConfig);

        return typedTestConfig;
    }

    private static validateTestConfiguration(typedTestConfig: FrameworkTestConfiguration, validatedConfigurationItems: TestConfigurationItem[]) {
        Configuration.validateTestConfigurationHasMandatoryItems(typedTestConfig);
        Configuration.validateTestConfigurationItems(typedTestConfig, validatedConfigurationItems);
    }

    private static getTestConfiguration(useFallback: boolean) {
        const baseProduct = this.product.split('.')[0];
        const testConfig = this.readFile(path.join(process.cwd(), 'config', baseProduct, `featureTestConfig.${useFallback ? baseProduct : this.product}.json`));
        const typedTestConfig = new FrameworkTestConfiguration();
        Object.assign(typedTestConfig, testConfig);
        return typedTestConfig;
    }

    private static validateTestConfigurationHasMandatoryItems(typedTestConfig: FrameworkTestConfiguration) {
        if (!typedTestConfig.testConfiguration || typedTestConfig.testConfiguration.length === 0) {
            throw new Error('The feature configuration did not contain a test configuration with items');
        }

        if (typedTestConfig.testConfiguration.filter(itm => itm.tag === 'Ignore').length === 0) {
            throw new Error('The feature configuration did not contain an Ignore tag. Please provide one.');
        }
    }

    private static validateTestConfigurationItems(typedTestConfig: FrameworkTestConfiguration, validatedConfigurationItems: TestConfigurationItem[]) {
        for (let item = 0; item < typedTestConfig.testConfiguration.length; item++) {
            const testConfiguration = typedTestConfig.testConfiguration[item];
            const typedTestConfiguration = new TestConfigurationItem();
            if (!testConfiguration.tag || testConfiguration.tag.trim().length === 0) {
                throw new Error(`Test configuration items must have a tag name at item ${item}`);
            }

            if ((testConfiguration.shouldRun === null || testConfiguration.shouldRun === undefined) || typeof (testConfiguration.shouldRun) !== 'boolean') {
                throw new Error(`Test configuration items must have a should run tag. It must be boolean. For "${testConfiguration.tag}"`);
            }

            if (!testConfiguration.shouldRun && (!testConfiguration.because || testConfiguration.because.trim().length === 0)) {
                throw new Error(`Test configuration items must have a reason to be disabled. For "${testConfiguration.tag}"`);
            }

            if (validatedConfigurationItems.filter(itm => itm.tag === testConfiguration.tag).length > 0) {
                throw new Error(`Test Configuration items must have unique names. More than one occurrence of "${testConfiguration.tag}"`);
            }

            Object.assign(typedTestConfiguration, testConfiguration);
            validatedConfigurationItems.push(typedTestConfiguration);
        }
    }

    /**
     *  makes sure that the acceptance criteria items are valid
     * @param set the current framework test configuration
     */
    private static getAcceptanceCriteriaItems(set: FrameworkTestConfiguration) {
        const acceptanceItems = new AcceptanceCriteria();
        Object.assign(acceptanceItems, set.acceptanceCriteria);
        const tempAcceptance = [];
        for (let item = 0; item < acceptanceItems.acceptanceCriteriaItems.length; item++) {
            const acceptanceCriteria = acceptanceItems.acceptanceCriteriaItems[item];
            Configuration.validateAcceptanceCriteria(acceptanceCriteria, item, tempAcceptance);
            const typedAcceptanceCriteria = new AcceptanceCriteriaItem();
            Object.assign(typedAcceptanceCriteria, acceptanceCriteria);
            tempAcceptance.push(typedAcceptanceCriteria);
        }

        acceptanceItems.acceptanceCriteriaItems = tempAcceptance;
        return acceptanceItems;
    }

    /**
     * Validates the acceptance criteria items
     * @param acceptanceCriteria the acceptance criteria item to validate
     * @param item the index of the item within the acceptance criteria array
     * @param tempAcceptance the current list of acceptance criteria items
     */
    private static validateAcceptanceCriteria(acceptanceCriteria: AcceptanceCriteriaItem, item: number, tempAcceptance: AcceptanceCriteriaItem[]) {
        if (!acceptanceCriteria.tag || acceptanceCriteria.tag.trim().length === 0) {
            throw new Error(`Acceptance Criteria tag name cannot be empty at item ${item}`);
        }

        if ((!acceptanceCriteria.value && !acceptanceCriteria.values) || (acceptanceCriteria.value?.trim().length === 0 && acceptanceCriteria.values.length === 0)) {
            throw new Error(`Acceptance Criteria tag must have a value for "${acceptanceCriteria.tag}"`);
        }

        if (tempAcceptance.filter(itm => itm.tag === acceptanceCriteria.tag).length > 0) {
            throw new Error(`Acceptance Criteria items must have unique names. More than one occurrence of "${acceptanceCriteria.tag}"`);
        }
    }

    /**
     * Reads a configuration file and parses the file contents into a javascript object
     * @param fileName the name of the file, including its full path.
     * @param [encoding] the encoding of the provided file
     * @returns the javascript object
     */
    private static readFile(fileName: string, encoding: BufferEncoding = 'utf8') {
        if (fs.existsSync(fileName)) {
            const res = readFileSync(fileName, { encoding });
            try {
                return JSON.parse(res);
            } catch (e) {
                const message: string = e.message.toString();
                const error = new Error(`There was a problem reading the file located at '${fileName}':\r\n\r\n ${message}`);
                if (e.stack) {
                    error.stack = e.stack;
                }

                throw error;
            }
        }

        throw new Error(`No test config found for product "${Configuration.product}". Make sure you have entered the name correctly.`);
    }
}