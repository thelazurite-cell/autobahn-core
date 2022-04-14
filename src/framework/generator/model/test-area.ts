import { SourcesType } from '../../configuration/sources-type.enum';

export class TestArea {
    /**
     * The test area name
     */
    public areaName: string = '';

    /**
     * The page object models for the testing area
     */
    public pageObjectModels: string[] = [];

    /**
     * The source type for the test area
     */
    public sourceType: SourcesType;

    /**
     * The feature files for the test area
     */
    public specs: string[] = [];

    /**
     * The step definitions for the test area
     */
    public steps: string[] = [];
}
