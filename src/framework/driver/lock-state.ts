export enum TestState {
    Running,
    Completed,
    Waiting
}

export type LockState = {
    testName: string;
    shouldLock: boolean;
    ignoreLock: boolean;
    thisSetLock: boolean;
    state: TestState;
};
