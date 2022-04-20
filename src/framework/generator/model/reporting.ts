import { ReportType } from './reportType';


export class Reporting {
    /**
     * The directory where the reports should be stored,
     * this will be worked out from the current working directory
     */
    public outputFolder: string = 'reports';

    /**
     * if a report type has not been configured with an extension, this will be used instead
     */
    public defaultExtension: string = 'txt';

    /**
     * if a report type has not been configured with a file name pattern, this will be used instead
     */
    public defaultFileNamePattern: string = '';

    /**
     * The list of all configured file types.
     */
    public types: ReportType[] = [];
}
