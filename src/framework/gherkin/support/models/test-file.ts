export class TestFile {
    fileName: string;
    // no way around this; comes from testcafe, or could be coming from mocha.
    // could cause conflicts if trying to lock down the type here. 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collectedTests: any[] = [];
}
