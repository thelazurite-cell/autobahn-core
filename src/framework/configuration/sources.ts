import { SourcesType } from './sources-type.enum';

export class Sources {
    /**
     * Gets or sets the type of source files that have been provided.
     */
    public type: SourcesType;
    /**
     * Gets or sets the locations that should be used for this type of source
     */
    public locations: string[] = [];

    /**
     * Gets or sets a value indicating whether the tests should use gherkin bdd-syntax
     */
    public useGherkin?: boolean = true;

    /**
     * Gets or sets the provider for the test type
     */
    public provider?: string = '';
}