import { TestFile } from './test-file';
import { messages } from '@cucumber/messages';

export class Spec {
    testFile: TestFile;
    gherkinResult: messages.Envelope[];
    gherkinDocument: messages.IGherkinDocument;
}
