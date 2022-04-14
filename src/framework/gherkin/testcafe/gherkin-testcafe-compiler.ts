import { readFileSync } from 'fs';
import { IGherkinCompiler } from '../support/gherkin-compiler.interface';

export class GherkinTestCafeCompiler implements IGherkinCompiler {

    async compileStepDefinitions(stepFiles: string[], externalCompilers: Compiler[]): Promise<void> {
        const compilerResult = externalCompilers.map(async (externalCompiler) => {
            const testFiles = stepFiles.filter(filename => {
                let supportedExtensions = externalCompiler.getSupportedExtension();

                if (!Array.isArray(supportedExtensions)) {
                    supportedExtensions = [supportedExtensions];
                }

                for (const extension of supportedExtensions) {
                    if (filename.endsWith(extension)) {
                        return true;
                    }
                }

                return false;
            });

            const compiledCode = await externalCompiler.precompile(
                testFiles.map(filename => {
                    const code = readFileSync(filename, 'utf-8');

                    return { code, filename };
                })
            );

            testFiles.forEach((filename, index) => {
                externalCompiler.execute(compiledCode[index], filename);
            });
        });

        await Promise.all(compilerResult);
    }

    getSupportedTestFileExtensions(): string[] {
        return ['.js', '.ts', '.feature'];
    }
}
