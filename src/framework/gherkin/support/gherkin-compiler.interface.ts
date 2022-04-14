
export interface IGherkinCompiler {
    compileStepDefinitions(stepFiles: string[], ...params: (Record<string, unknown> | Record<string, unknown>[])[]): Promise<void>;
    getSupportedTestFileExtensions(): string[];
}
