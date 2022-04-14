/*
 * mssql-connector.ts

 */
import { ConnectionPool, IResult } from 'mssql';
import { State } from '../logging/state';
import { LogItem } from '../logging/log-item';
import { Level } from '../logging/level';
import { Parameter } from './mssql-parameter';

export class MssqlConnector {
    public pool?: ConnectionPool;
    private client = require('mssql/msnodesqlv8');

    constructor(connectionString: string) {
        this.Initialize(connectionString);
    }

    public Initialize(connectionString: string): void {
        const cs = require('mssql/lib/connectionstring');
        const cfg = cs.resolve(connectionString);
        cfg.options.enableArithAbort = true;
        const localDb = '(localdb)';
        if (connectionString.includes(localDb))
            cfg.server = localDb;
        State.log(new LogItem(`Uses DB configuration:\r\n ${JSON.stringify(cfg)}`, Level.Debug));
        this.pool = new this.client.ConnectionPool(cfg);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async RunCommand(sql: string, parameters: Parameter[] | null = null): Promise<any> {
        State.log(new LogItem(sql, Level.Debug));
        if (!this.pool) {
            State.log(new LogItem('Pool was not set up', Level.Error));

            return;
        }

        await this.pool.connect().then(async value => {
            State.log(new LogItem('Connected: ' + JSON.stringify(value), Level.Debug));
            const request = new this.client.Request(this.pool);
            if (parameters) {
                parameters.forEach(itm => {
                    request.input(itm.name, itm.value);
                });
            }

            // We are working with a javascript library to get a record from the database
            // We will not know the type we are working with at this point. 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await request.query(sql).then(async (result: IResult<any>) => {
                State.log(new LogItem('Completed sql command:' + JSON.stringify(result.output), Level.Debug));
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- js lib - dynamic variable type
                State.log(new LogItem(`Affected ${result.rowsAffected} row(s)`, Level.Debug));
                if (result.recordset && result.recordset.length)
                    State.log(new LogItem(`RecordSet: ${result.recordset.length} row(s)`, Level.Debug));
                await this.pool.close();
            }, async (reason: never) => {
                State.log(new LogItem('SQL Error: ' + JSON.stringify(reason), Level.Error));
                await this.pool.close();
            });
        }, (reason) => {
            State.log(new LogItem('SQL Error: ' + JSON.stringify(reason), Level.Error));
        });

        return Promise.resolve();
    }
}
