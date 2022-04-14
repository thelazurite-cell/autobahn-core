import { inject, injectable } from 'inversify';
import { FrameworkFunctionality } from '../../framework-functionality.config';
import { MochaReporterParams } from './mocha-bdd-compiler';

@injectable()
export abstract class MochaCompiler {
    sources: string[];
    report: string;
    reportOptions: MochaReporterParams;

    constructor(
        @inject(FrameworkFunctionality.MochaSources) sources: string[],
        @inject(FrameworkFunctionality.MochaReportType) report: string,
        @inject(FrameworkFunctionality.MochaReportOptions) reportOptions: MochaReporterParams
    ) {
        this.sources = sources;
        this.report = report;
        this.reportOptions = reportOptions;
    }

    public run(): Promise<number> {
        return Promise.resolve(0);
    }
}

