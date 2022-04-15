import { Product } from './product';
import { Browser } from '../../configuration/browser';


export class Project {
    /**
     * Cucumber provider for the project.
     */
    public cucumberProvider: string = '@cucumber/cucumber';

    /**
     * Gets or sets the browser specific configuration to use for the provided application environment.
     */
    public browsers: Browser[] = [
        {
            name: 'firefox',
            command: '',
            headlessCommand: ''
        },
        {
            name: 'chrome',
            command: ' --allow-insecure-localhost --allow-running-insecure-content --start-maximized --enable-automation --disable-backgrounding-occluded-windows --disable-background-timer-throttling',
            headlessCommand: ' --disable-web-security --allow-insecure-localhost --allow-running-insecure-content --enable-automation'
        },
        {
            name: 'edge',
            command: ' --allow-insecure-localhost --allow-running-insecure-content --start-maximized --enable-automation --disable-backgrounding-occluded-windows --disable-background-timer-throttling',
            headlessCommand: ' --disable-web-security --allow-insecure-localhost --allow-running-insecure-content --enable-automation'
        }
    ];

    /**
     * The products related to the automation test project
     */
    public products: Product[] = [];

    /**
     * The value determining whether the test runner should create self signed certificates.
     */
    public usesCertificates: boolean = true;

    /**
     * The value determining whether the registry definition for the downloads folder should be looked up
     * on the win32 plaform
     */
    public ignoresRegistry: boolean = false;
}
