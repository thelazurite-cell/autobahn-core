import Mocha from 'mocha';
import { Configuration } from '../../configuration/configuration';
import { inject, injectable } from 'inversify';
import { MochaCompiler } from './mocha-compiler.abstract';
import { GlobReader } from '../support/glob-reader';
import { FrameworkFunctionality } from '../../framework-functionality.config';
import { MochaReporterParams } from './mocha-bdd-compiler';

@injectable()
export class MochaVanillaCompiler implements MochaCompiler {
    sources: string[];
    report: string;
    reportOptions: MochaReporterParams;

    mochaRunner: Mocha = new Mocha({
        ui: 'bdd',
        reporter: Configuration.application.frameworkConfig.mochaReporters,
        fullStackTrace: process.argv.findIndex(val => val === '--debug') > -1
    });

    constructor(
        @inject(FrameworkFunctionality.MochaSources) sources: string[],
        @inject(FrameworkFunctionality.MochaReportType) report: string,
        @inject(FrameworkFunctionality.MochaReportOptions) reportOptions: MochaReporterParams
    ) {
        this.sources = GlobReader.getTestFiles(sources);
        this.report = report;
        this.reportOptions = reportOptions;
    }

    public run(): Promise<number> {
        if (this.reportOptions) {
            this.mochaRunner.reporter(this.report, this.reportOptions);
        } else {
            this.mochaRunner.reporter(this.report);
        }

        this.sources.forEach(file => this.mochaRunner.addFile(file));

        return new Promise((resolve, reject) => {
            try {
                this.mochaRunner.run((failures) => {
                    resolve(failures);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
