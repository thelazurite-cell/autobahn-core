/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * state.ts

 */
import { LogItem } from './log-item';
import { Level } from './level';
import { ConsoleColor } from '../helpers/console-color.enum';
import * as fs from 'fs';
import * as Path from 'path';
import { Configuration } from '../configuration/configuration';
import * as path from 'path';
import { exec } from 'child_process';
import portfinder from 'portfinder';
import { ClientFunction } from 'testcafe';

export class State {
    /**
     * An array of @typedef LogItem objects. This will contain information from running
     * a test.
     */
    protected static logItems: LogItem[] = [];

    /**
     * When the log items are being read by the console, or being saved to a file. 
     */
    public static currentBrowser: string = 'init';

    /**
     * The current scope @typedef TestController that is running a test.
     * Has to be set as any as the type is not available at this point.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static scope: any;

    /**
     * The arguments being sent through from the command line interface. 
     * is passed through as any because it is minimized to a js object.
     * 
     * TODO: create a class containing all possible arguments that can be sent 
     * to the test framework.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static args: any;

    /**
     * The Custom resoponse timeout in ms; this is used when the feature step
     * explicitly sets 
     */
    public static customResoponseTimeoutMs: number = 0;

    /**
     * Contains accepted ports to be used by the framework, this is so the 
     * @method getPort method does not re-use the same port when we expect to open up another.
     */
    private static ports: number[] = [];

    /**
     * The logout function to use when attempting to retry a test.
     * 
     * Todo: Create an interface where common actions for a product such as retryTest
     * can live
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static logoutFunction: (t: any) => void = function (t: any) { return; }

    /**
     * The current platform the test framework is running on
     */
    public static platform: string = '';

    /**
     * Gets the downloads directory for the currently running platform,
     * By default the user downloads directory should be %UserProfile%\Downloads
     * However, this value can be changed in registry to point to another directory. 
     * This will check the registry to confirm where the downloads folder actually is. 
     * 
     * The check is more lax for linux and mac machines as it will assume the directory is
     * /user/%username%/downloads/ 
     */
    public static get downloadsDirectory(): string {
        if (Configuration.application.frameworkConfig.downloadsPath) {
            return Configuration.application.frameworkConfig.downloadsPath;
        }

        if (this.platform === 'win32') {
            let value = '';

            if (!Configuration.ignoresRegistry) {
                // only import these if we're certain the platform running is windows.
                // must be of 'any' type because it is a js lib.
                const Key: any = require('windows-registry-napi').Key;
                const windef: any = require('windows-registry-napi').windef;

                // path to current user downloads in registry 
                const KeyPath: string = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders';
                const DownloadKeyName: string = '{374DE290-123F-4565-9164-39C4925E467B}';

                // read from the registry
                const regKey: any = new Key(windef.HKEY.HKEY_CURRENT_USER, KeyPath, windef.KEY_ACCESS.KEY_READ);
                value = regKey.getValue(DownloadKeyName).toString();

                // close the key to prevent unmanaged resource leaks
                regKey.close();

                value = value.replace('%USERPROFILE%', process.env.USERPROFILE);
            }

            // if there is no value, default to the common directory
            if (value.trim() === '') {
                return path.join(process.env.USERPROFILE, 'Downloads');
            }

            return value;
        }

        return path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads');
    }

    /***
     * Gets random number between 15000-15100 to use as a port and checks that the port
     * is not in use. This should ensure that the port number is unique.
     * @param [startRange] optionally, you can provide a starting number range for ports to search. 
     * @param [endRange] optionally, you can provide an ending number for the range of ports.
     * @returns an available port number. 
     */
    public static getPort(startRange: number = 15000, endRange: number = 15100): Promise<number> {
        const attempts = 0;
        return this.attemptGetPort(attempts, startRange, endRange);
    }

    public static attemptGetPort(attempts: number, startRange: number, endRange: number): Promise<number> {
        const range = endRange - startRange;

        return new Promise(resolve => {

            const checkPort = Math.floor(Math.random() * range) + startRange;
            portfinder.basePort = checkPort;

            portfinder.getPortPromise({ startPort: startRange, stopPort: endRange })
                .then((port) => {
                    this.ports.push(port);
                    resolve(port);
                }).catch((error) => {
                    console.log(error);
                    const maxAttempts = 3;
                    if (attempts + 1 === maxAttempts) {
                        console.error('Could not retrieve a port after the maximum of 3 attempts.');
                        process.exit(-1);
                    } else {
                        attempts++;
                        this.attemptGetPort(attempts, startRange, endRange).then((port) => {
                            resolve(port);
                        });
                    }
                });

        });
    }

    /**
     * Performs a check to make sure a file has been downloaded. 
     * @param location the location of the file to check
     * @param [maxWaitInSeconds] the maximum time to wait in seconds to wait before checking a file has been downloaded or not.
     * @returns true if the file has been downloaded.
     */
    public static waitForDownloaded(location: string, maxWaitInSeconds: number = 1): Promise<boolean> {
        return new Promise(resolve => {
            let i = 1;
            const intervalId = setInterval(() => {
                const exists = State.fileExists(location);
                if (exists) {
                    clearInterval(intervalId);
                    resolve(true);
                }

                i++;
                if (i > maxWaitInSeconds) {
                    clearInterval(intervalId);
                    resolve(false);
                }
            }, 1000);
        });
    }

    /**
     * Performs a check to make sure a file has been downloaded, it can be any of the names provided in the array.
     * @param location the location of the file to check
     * @param [maxWaitInSeconds] the maximum time to wait in seconds to wait before checking a file has been downloaded or not.
     * @returns true if the file has been downloaded.
     */
    public static waitForAny(locations: string[], maxWaitInSeconds: number = 1): Promise<string | boolean> {
        return new Promise(resolve => {
            let i = 1;
            const intervalId = setInterval(() => {
                for (const file of locations) {
                    const exists = State.fileExists(file);
                    if (exists) {
                        clearInterval(intervalId);
                        resolve(file);
                    }
                }

                i++;
                if (i > maxWaitInSeconds) {
                    clearInterval(intervalId);
                    resolve(false);
                }
            }, 1000);
        });
    }

    /**
     * When a log item is created using State.log, the message will be displayed from the console window
     * and save it temporarily in memory until it is ready to be saved in a file. Should the framework not
     * be run in debugging mode, then they will not be displayed to the console window. 
     * @param logItem the @typedef LogItem to save.
     */
    public static log(logItem: LogItem): void {

        if (this.args && this.args.debug) {
            switch (logItem.level) {
                case Level.Error:
                    console.error(`${ConsoleColor.FgRed}${logItem.toString()}${ConsoleColor.Reset}`);
                    break;
                case Level.Warning:
                    console.warn(`${ConsoleColor.FgYellow}${logItem.toString()}${ConsoleColor.Reset}`);
                    break;
                case Level.Debug:
                    console.info(`${ConsoleColor.FgBlue}${logItem.toString()}${ConsoleColor.Reset}`);
                    break;
                default:
                    console.info(logItem.toString());
            }
        }

        this.logItems.push(logItem);
    }

    /**
     * Saves a log file based on the currently running test.
     * @param directory the directory where the file should be saved to
     * @param fileNameFormat the format string for the file name to be saved under.
     * @returns the return value should be ignored.
     */
    public static async saveLogFile(directory: string, fileNameFormat: string, fileExtension: string): Promise<void> {
        this.createMissingDirectories(path.resolve(directory));
        const unacceptedCharacters = /([^\d\w.])/g; // any character that isn't a '.', 'a-Z', or '0-9'

        let formattedFileName = fileNameFormat.replace(unacceptedCharacters, '');

        const maxFileNameLength = 150;
        if (formattedFileName.length > maxFileNameLength) {
            formattedFileName = formattedFileName.slice(0, maxFileNameLength);
        }

        const file = Path.join(directory, `${formattedFileName}${fileExtension}`);
        await State.saveLogReport(file).catch((reason) => {
            const err = new Error(reason);
            // throw the error with the original stack trace
            if (reason.stack)
                err.stack = reason.stack;
            throw err;
        });
    }

    /**
     * Checks if a files exists on the file system.
     * @param fileName the file to check
     * @returns true if the file exists 
     */
    public static fileExists(fileName: string): boolean {
        return fs.existsSync(fileName);
    }

    /**
     * Creates missing directories from the array provided. Each time a directory is to be created,
     * it will be joined to the previous directory with the path separator. 
     * @param paths the array containing each folder to be created.
     * @param pathSeparator the separator used by the full directory path.
     */
    public static createMissingDirectories(path: string): void {
        try {
            fs.mkdirSync(path, { recursive: true });
        } catch (error) {
            console.log('Couldn\'t create directory ::>', error);
        }
    }

    /**
     * Saves a log report based on the messages that have been returned from a running test.
     * @param fileName the file that should be saved to
     * @returns the return should be ignored.
     */
    public static async saveLogReport(fileName: string): Promise<void> {
        fs.open(fileName, 'wx', (err, fd) => {
            if (this.createWasSuccessful(err)) {
                const stream = fs.createWriteStream(fileName, { fd, encoding: 'utf-8' });
                stream.write(Buffer.from(this.logItems.join('\r\n')));
                stream.close();
                this.flushLog();
            }
        });
    }

    /**
     * Checks if the error parameter provided from creating a file was populated or not
     * @param error the error parameter from fs.open; will be undefined if no error occured.
     * @returns true if the file didn't exist.
     */
    private static createWasSuccessful(error: NodeJS.ErrnoException): boolean {
        if (error) {
            const existsErrorCode: string = 'EEXIST';
            if (error.code === existsErrorCode) {
                console.error('Log file already exists');
                return false;
            }

            throw error;
        }

        return true;
    }

    /**
     * Clears the log item array.
     */
    public static flushLog(): void {
        this.logItems = [];
    }

    public static async setUiMessage(messageString?: string) {
        const id = 'tcf-message';
        await ClientFunction((messageString, id) => {
            const ele = document.getElementById(id);
            if (ele) {
                if (!messageString || messageString.length <= 0) {
                    ele.parentElement.removeChild(ele);
                } else {
                    ele.innerHTML = messageString;
                }
            } else {
                const tcfMessage = document.createElement('div');
                tcfMessage.setAttribute('id', id);
                tcfMessage.innerHTML = messageString;
                tcfMessage.style.background = '#000';
                tcfMessage.style.opacity = '0.75';
                tcfMessage.style.color = '#fff';
                tcfMessage.style.position = 'fixed';
                tcfMessage.style.left = '0';
                tcfMessage.style.bottom = '52px';
                tcfMessage.style.width = '100%';
                tcfMessage.style.padding = '5px';
                document.body.appendChild(tcfMessage);
            }
        })(messageString, id);
    }
}
