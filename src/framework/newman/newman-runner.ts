import { Configuration } from '../configuration/configuration';
import path from 'path';
import newman from 'newman';

export class NewmanRunner {
    private readonly postmanEnvironmentSuffix = 'postman_environment.json';
    private allSources: number;
    private totalFails: number = 0;

    public run(
        sources: string[],
        reportType: string,
        reportDirectory: string
    ): Promise<number> {
        console.log(`attempting to run postman collections against environment: ${Configuration.environment}`);
        console.log(`${reportType} is being used as the report type`);
        console.log(`reports will be saved to ${reportDirectory}`);

        return new Promise((resolve, reject) => {
            this.allSources = sources.length - 1;
            sources.forEach(source => {

                const forwardSlash = source.includes('/');
                const directory = source.split(forwardSlash ? '/' : '\\');
                directory.pop();
                console.log(source);
                const baseName = directory[directory.length - 1];
                const environmentFile = `${baseName}.${Configuration.environment}.${this.postmanEnvironmentSuffix}`;
                const environmentDirectory = path.join(...directory, environmentFile);

                const exportPath = path.join(process.cwd(), reportDirectory, `${baseName}.api.xml`);

                console.log(`report output path is: ${exportPath}`);

                newman.run({
                    collection: source,
                    environment: environmentDirectory,
                    reporters: ['xunit', 'cli'],
                    reporter: {
                        xunit: {
                            export: exportPath
                        }
                    },
                    iterationCount: 1

                }, (err, summary) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }

                    this.totalFails += summary.run.failures.length;

                    if (this.allSources === 0) {
                        resolve(this.totalFails);
                    }

                    this.allSources = this.allSources - 1;
                });
            });
        });

    }
}