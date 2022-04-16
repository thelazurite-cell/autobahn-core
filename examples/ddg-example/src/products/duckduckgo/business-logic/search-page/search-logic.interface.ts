export interface ISearchLogic {
    onSearchPage(i: TestController): Promise<void>;
    enterSearchTerm(i: TestController, searchTerm: string): Promise<void>;
    onResultsPage(i: TestController): Promise<void>;
    shouldSeeResult(i: TestController, expectedResult: string): Promise<void>;
}
