import { Dictionary } from '../helpers/dictionary';
import { TestCafeTimeouts } from './testcafe-timeouts';

/**
 * Provides additional information to the @typedef TypedTestCafeCompiler
 */

export class TestcafeConfigurationItem {
    /**
     * Gets or sets the expected Metadata for the testcafe fixture/test
     */
    metadata?: Dictionary = new Dictionary();

    /**
     * Gets or sets the additional client scripts to execute for a testcafe configuration item
     */
    clientScripts?: string[] = [];

    /**
     * Gets or sets the page for a testcafe configuration item.
     */
    page?: string;

    /**
     * Overrides testcafe/cli arguments for caching page/css/images for the provided testcafe fixture/test
     */
    disablePageCaching: boolean = false;

    /**
     * Gets or sets the authentication provider for the testcafe fixture/test
     */
    authenticationProvider?: string;

    /**
     * Gets or sets the mock api providers for the testcafe fixture/test
     */
    mockApiProviders?: string[] = [];
    timeouts?: TestCafeTimeouts;
}