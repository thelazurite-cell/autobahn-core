/* eslint-disable max-classes-per-file */
import * as TestCafe from 'testcafe';
import { IDefinitionParameters, IHookDefinitionOptions } from '@cucumber/cucumber/lib/models/definition';
import APIBasedTestFileCompilerBase from 'testcafe/lib/compiler/test-file/api-based';
import { messages } from '@cucumber/messages';
import { DataTable } from '@cucumber/cucumber';

declare global {

    // eslint-disable-next-line @typescript-eslint/ban-types
    export type Func = Function;

    export interface FeatureCtx {
        featureName: string;
    }

    export type Hook = IDefinitionParameters<IHookDefinitionOptions>;

    export type StepRunnableResult = (boolean | RegExpExecArray | string[] | DataTable);

    export type ExecutorResult = void | Promise<void> | Promise<ExecutorSpecificParams>;

    // Disable ban-types for this type, as we are working with a library which
    // works with usually banned types
    // eslint-disable-next-line @typescript-eslint/ban-types
    export type ExecutorFunction = (...params: (StepRunnableResult | Function | Object)[]) => ExecutorResult;
    export type ExecutorSpecificParams = (Record<string, unknown> | unknown)[];
    export type Compiler = APIBasedTestFileCompilerBase;
    export type CompilerArray = (Record<string, unknown> | Compiler)[];

    export type Step = messages.Pickle.PickleStep | messages.GherkinDocument.Feature.Step;

    export type Tag = (string | string[]);

    namespace gherkin {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        export import testcafe = TestCafe;

        export interface DataTable {
            /** Returns the table as a 2-D array. */
            raw(): string[][];

            /** Returns the table as a 2-D array, without the first row. */
            rows(): string[][];

            /** Returns an object where each row corresponds to an entry (first column is the key, second column is the value). */
            rowsHash(): { [firstCol: string]: string };

            /** Returns an array of objects where each row is converted to an object (column header is the key). */
            hashes(): { [colName: string]: string }[];
        }

        export type HookFunction = (testController: typeof TestCafe) => Promise<void>;
        export type GlobalHookFunction = (fixtureContext: { [key: string]: unknown }) => Promise<void>;

        export function After(code: HookFunction): void;
        export function After(options: string, code: HookFunction): void;

        export function AfterAll(code: GlobalHookFunction): void;

        export function Before(code: HookFunction): void;
        export function Before(options: string, code: HookFunction): void;

        export function BeforeAll(code: GlobalHookFunction): void;

        export type StepFunction = (
            testController: TestController,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parameters: any[],
            dataTable: DataTable | null
        ) => Promise<void>;

        export function Given(pattern: RegExp | string, code: StepFunction): void;

        export function When(pattern: RegExp | string, code: StepFunction): void;

        export function Then(pattern: RegExp | string, code: StepFunction): void;
    }
}
