import { ISearchLogic } from './search-logic.interface';
import { injectable } from 'inversify';
import { searchPage, resultPage } from './search.functions';
import { ClientFunction } from 'testcafe';
import { PageObjectModel } from '../../../../../../../dist/framework/driver/page-object-model';
import { Configuration } from '../../../../../../../dist/framework/configuration/configuration';

// Running outside the source of this repo, you should use the project's imports: 
//
// import { PageObjectModel } from 'autobahn-core/dist/framework/driver/page-object-model';
// import { Configuration } from 'autobahn-core/dist/framework/configuration/configuration';



@injectable()
export class SearchLogic implements ISearchLogic {
    public async onSearchPage(i: TestController): Promise<void> {
        const search = searchPage(i);

        await PageObjectModel.goTo(i, search.getPomUrl());
    }

    public async enterSearchTerm(i: TestController, searchTerm: string): Promise<void> {
        const search = searchPage(i);
        await search.fillInField(i, 'searchforminputhomepage', searchTerm);
        await i.click(search.searchbuttonhomepage.get(i));

        i.ctx.searchTerm = searchTerm;
    }

    public async onResultsPage(i: TestController): Promise<void> {
        await resultPage(i).onPage(i);
    }

    public async shouldSeeResult(i: TestController, expectedResult: string): Promise<void> {
        const results = resultPage(i);
        const sut = results.searchResultTitles.get(i).withText(expectedResult);

        await i
            .expect(sut.exists)
            .ok(
                `Expected a result title with the text '${expectedResult}' to be visible.`,
                {
                    timeout: Configuration.application.frameworkConfig.assertionTimeoutMs
                }
            );
    }

    private async removeElement(i: TestController, elementSelector: string): Promise<void> {
        await ClientFunction(elementSelector => {
            const element = document.querySelector(elementSelector);
            element.parentNode.removeChild(element);
        }).with({ boundTestRun: i })(elementSelector);
    }
}
