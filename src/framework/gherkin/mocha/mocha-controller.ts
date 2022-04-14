import { Request, Response } from 'supertest';
import { ConsoleColor, symbols } from '../../helpers/console-color.enum';
import { args } from '../../framework.config';


export class MochaController {
    runType: string;
    testName: string;
    fixtureName: string;
    testLocation: string;
    callbackCalled: boolean = false;
    request: Request;
    response: Response;

    /**
     * pauses test execution
     * @returns the test back into execution mode
     */
    debug(): Promise<void> {
        if (!args.debug)
            return Promise.resolve();
        console.log(`${ConsoleColor.FgCyan}${ConsoleColor.Blink}*** ${symbols.bang} PAUSED ***${ConsoleColor.Reset}`);
        process.stdin.setRawMode(true);
        return new Promise(resolve => process.stdin.once('data', () => {
            process.stdin.setRawMode(false);
            resolve();
        }));
    }

    // We shouldn't be restrictive on what data can be set within the context
    // by using never or unknown, we would be restricting our access until casting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: Record<string, any> = new Map<string, any>();
}
