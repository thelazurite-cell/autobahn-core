import { Runner } from '../runner';

export type TestCafeInstance = {
    retryTestPages: (arg0: boolean) => void;
    createRunner: () => Runner;
    close(): Promise<void>;
};
