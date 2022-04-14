/*
 * app-configuration.ts

 */
import { FrameworkSettings } from './framework-settings';
import { Dictionary } from '../helpers/dictionary';

export class AppConfiguration {
    /**
     * Gets or sets whether the application being tested should use SSL
     */
    public ssl: boolean = false;

    /**
     * Gets or sets the application url (without the http/https prefix)
     */
    public testHost: string = '';

    /**
     * Gets or sets the root of the application. often should just be set to '/'
     */
    public applicationRoot: string = '';

    /**
     * Gets or sets the application specific configuration that changes per environment.
     * If the configuration does not change per environment, then it should be stored in the 
     * feature test configuration instead.
     */
    public details: Dictionary = new Dictionary();

    /**
     * Gets or sets the Database connections for the application. These are not necessary for running
     * most tests.
     */
    public dataConnections: Dictionary = new Dictionary();

    /**
     * Gets or sets the framework specific configuration to use for the provided application environment.
     */
    public frameworkConfig: FrameworkSettings;

    /**
     * Gets an application detail item based off the name provided
     * @param keyName the name of the application detail item to search for.
     * @returns the expected application detail item if it exists
     * @throws an error if there is no application detail item matching the expected name.
     */
    public getAppDetail(keyName: string): string {
        if (this.details && this.details[keyName]) {
            return this.details[keyName];
        }

        throw new Error(`Could not find an application detail with a name of '${keyName}'`);
    }

    /**
     * Gets a data connection item from the configuration using the name provided
     * @param keyName the name of the data connection to search for
     * @returns the requested data connection if one exists with the name provided
     * @throws an error if no data connection matches the provided name
     */
    public getDataConnection(keyName: string): string {
        if (this.dataConnections && this.dataConnections[keyName]) {
            return this.dataConnections[keyName];
        }

        throw new Error(`Could not find a database connection with a name of '${keyName}'`);
    }
}
