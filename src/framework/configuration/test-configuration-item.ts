import { TestcafeConfigurationItem } from './testcafe-configuration-item';

/*
 * test-configuration-item.ts

 */
export class TestConfigurationItem {
    /**
     * Gets or sets the name of a test configuration item tag. 
     * The names should not contain an @ within the configuration files,
     * but will be called from the feature files by prefixing them with an @ 
     */
    tag: string = '';

    /**
     * Gets or sets a value indicating whether tests decorated with this tag should run or not.
     */
    shouldRun: boolean = true;

    /**
     * Gets or sets a value indicating the reason for a tag being disabled.
     */
    because?: string = '';

    /**
     * Gets or sets the test cafe configuration for a suite (fixture) of tests, or a specific test. 
     */
    testCafeConfiguration?: TestcafeConfigurationItem;
}

