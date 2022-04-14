/* eslint-disable @typescript-eslint/require-await */
/*
 * server.ts

 * 
 * Starts the logging server to recieve information from the browser.
 */
import app from './node-application';
import { State } from '../state';
import { LogItem } from '../log-item';
import { Level } from '../level';

const bodyParser = require('body-parser');
const cors = require('cors');

require('testcafe');

export class ServerLoggerSingleton {
    public static nodePort: number = 31373;
    public static run: boolean = false;

    public static async initializeServerLogger(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (ServerLoggerSingleton.run) {
                return;
            }

            ServerLoggerSingleton.run = true;
            (async () => {
                app.use(cors());
                app.use(function (_req, res, next) {
                    res.header('Access-Control-Allow-Origin', '*');
                    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                    next();
                });

                app.use(bodyParser.json({ limit: '250mb' }));
                app.use(bodyParser.urlencoded({ limit: '250mb', extended: true, parameterLimit: 1000 }));
                app.listen(ServerLoggerSingleton.nodePort, () => {
                    State.log(new LogItem(`Listening to client logs sent on port ${ServerLoggerSingleton.nodePort}`, Level.Info));
                });
            })().then(() => {
                State.log(new LogItem(`Snoopy server started.`, Level.Info));
                resolve();
            }, reason => {
                State.log(new LogItem(`Couldn't start the Snoopy server`, Level.Error));
                State.log(new LogItem(reason, Level.Debug));
                reject();
            });
        });
    }
}