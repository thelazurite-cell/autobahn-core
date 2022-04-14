/*
 * log-item.ts

 */
import { Level } from './level';
import { State } from './state';
import moment from 'moment';

type LoggableType = Record<string, unknown> | string | number | undefined;

export class LogItem {
    public readonly message: string;
    public level: Level;
    private dateTime: Date;
    private external: boolean = false;
    public isAjaxStart: boolean = false;
    public isAjaxEnd: boolean = false;

    constructor(message: LoggableType, level: Level = Level.Info) {
        this.message = message ?
            message.toString() == '[object Object]' // if it's a JS Object we want to log the whole object.
                ? JSON.stringify(message)
                : message.toString()
            : '';

        this.level = level ? level : Level.Info;
        this.dateTime = new Date();
    }

    public toString = (): string => `[${this.level}] [${State.currentBrowser}] [${moment(this.dateTime).toISOString()}] ${this.external ? '[Client]:' : ':'} ${this.message}`;
}
