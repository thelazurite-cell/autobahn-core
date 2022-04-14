/*
 * routes.ts

 */
import * as express from 'express';
import { LogItem } from '../log-item';
import { State } from '../state';
import { Level } from '../level';

export class Routes {
    public initialize(app: express.Application): void {
        app.route('/').get((request, response) => {
            response
                .status(200)
                .contentType('application/json')
                .send(JSON.stringify({ status: 'ok', message: 'client capture running' }));
        });

        /***
         * route: send log item - sends a log item captured from the client browser
         * so that it can be displayed in test run logs.
         */
        app.route('/sendLogItem').post((request, response) => {
            try {
                const logItem = new LogItem(undefined);
                Object.assign(logItem, request.body);
                State.log(logItem);
                response
                    .status(200)
                    .contentType('application/json')
                    .send(JSON.stringify({ status: 'ok', details: 'sent' }));
            } catch (e) {
                // well, at least we tried.
                State.log(new LogItem('Failed to add to log', Level.Debug));
                console.log(e);
                response
                    .status(500)
                    .contentType('application/json')
                    .send(JSON.stringify({ status: 'error', detailsText: e.toString(), details: JSON.stringify(e) }));
            }
        });
    }
}

