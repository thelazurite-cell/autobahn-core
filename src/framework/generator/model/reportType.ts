export class ReportType {
    /**
     * The report type's name. e.g. if the report type is testcafe-reporter-jest then this should be jest
    */
    public name: string = '';

    /**
     * The report type's file extension
     */
    public extension?: string = '';

    /**
     * The file name pattern to be used for the report type.
     * certain values will be replaced with their actual values:
     * [product] - the name of the product
     * [environment] - the environment run against
     * [sourceType] - the type of test run (e.g. browser, api or newman)
    */
    public fileNamePattern?: string = '';
}
