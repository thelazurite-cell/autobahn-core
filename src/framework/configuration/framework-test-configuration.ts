/*
 * framework-test-configuration.ts

 */
import { Dictionary } from '../helpers/dictionary';
import { AcceptanceCriteria } from './acceptance-criteria';
import { TestConfigurationItem } from './test-configuration-item';

export class FrameworkTestConfiguration {
    /**
     * Gets or sets the Test configuration. This contains the test tags that are used within each feature file.
     * If shouldrun is set to false, the framework should ignore those tests. A 'because' reason should be provided. 
     */
    public testConfiguration: TestConfigurationItem[] = [];

    /**
     * Gets or sets the expected strings for the application. 
     * This could be anything from validation errors, to expected text to be displayed.
     */
    public applicationStrings?: Dictionary = new Dictionary();

    /**
     * Gets or sets a default address for the environment. 
     */
    public defaultAddress?: Dictionary = new Dictionary();

    /**
     * Gets or sets Acceptance criteria of framework test configuration. These are application specific configuration items
     * that do not change on an environment basis. 
     */
    public acceptanceCriteria: AcceptanceCriteria = new AcceptanceCriteria();

    public getTag(tagName: string): TestConfigurationItem {
        return this.testConfiguration.filter(itm => itm.tag === tagName)[0];
    }
}
