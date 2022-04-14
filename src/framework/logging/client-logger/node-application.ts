/*
 * node-application.ts

 */
import * as bodyParser from 'body-parser';
import { Routes } from './routes';

const express = require('express');
class NodeApplication {
    public app;
    public routeProvider: Routes = new Routes();

    constructor() {
        this.app = express();
        this.configure();
        this.routeProvider.initialize(this.app);
    }

    private configure(): void {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false, parameterLimit: 50000 }));
    }
}

export default new NodeApplication().app;
