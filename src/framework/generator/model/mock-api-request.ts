

export class MockApiRequest {
    public name: string = '';
    public requestTo: string = '';
    public usesApplicationUrl: boolean;
    public hostUrl: string;
    public responseStatusCode: number;
    public responseBody: string;
}
