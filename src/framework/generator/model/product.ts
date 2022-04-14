import { TestArea } from './test-area';
import { LogicModel } from './logic-model';
import { MockApiRequest } from './mock-api-request';

export class Product {
    /**
     * The name of the product
     */
    public productName: string = '';

    /**
     * The name of the IOC container
     */
    public containerName: string = '';

    /**
     * Tag config name for the product
     */
    public tagConfigName: string = '';

    /**
     * Test area name for the product
     */
    public testAreaName: string = '';

    /**
     * The IOC container for the product
     */
    public containerConfig: string = '';

    /**
     * Tag config file for the product
     */
    public tagConfig: string = '';

    /**
     * Test area config file for the product
     */
    public testAreaConfig: string = '';

    /**
     * The folder location for the business logic models.
     */
    public baseLogicFolder: string = '';

    /**
     * the folder for storing the page object models.
     */
    public basePageObjectFolder: string = '';

    /**
     * the folder for storing the spec files
     */
    public baseSpecFolder: string = '';

    /**
     * the folder for storing the api spec files
     */
    public apiSpecFolder: string = '';

    /**
     * the folder for storing the browser spec files
     */
    public browserSpecFolder: string = '';

    /**
     * the folder for storing the step files.
     */
    public baseStepFolder: string = '';

    /**
     * the folder for storing the api step files.
     */
    public apiStepFolder: string = '';

    /**
     * the folder for storing the browser step files.
     */
    public browserStepFolder: string = '';

    /**
     * Test areas of the product
     */
    public testAreas: TestArea[] = [];

    /**
     * The business logic models associated with the product
     */
    public logicModels: LogicModel[] = [];

    /**
     * Variants of the product
     */
    public variants: string[] = [];

    /**
     * The default variant to use with the generator
     */
    public fallbackVariant: string = '';

    /**
     * Environments for the product
     */
    public environments: string[] = [];

    /**
     * Application Config files for the product
     */
    public appConfigFiles: string[] = [];

    /**
     *Feature Config files for the product
     */
    public featureConfigFiles: string[] = [];

    /**
     * The Base configuration path for the product
     */
    public baseConfigPath: string = '';

    /**
     * The mock api requests that the product can use
     */
    public mockApiRequests: MockApiRequest[] = [];

    /**
     * Newman collection path for the product
     */
    public newmanCollectionPath?: string;
}


