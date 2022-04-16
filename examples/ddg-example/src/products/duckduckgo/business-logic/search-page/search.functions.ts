import { getTaggedOrDefault } from '../../../../../../../dist/framework/ioc/getExtensions';
import { Results } from '../../page-object-models/search-page/results.page-model';
import { Search } from '../../page-object-models/search-page/search.page-model';
import DuckduckgoTestArea from '../duckduckgo-test-area.config';
import { DuckduckgoContainer } from '../duckduckgo.config';
import { ISearchLogic } from './search-logic.interface';

// Running outside the source of this repo, you should use the project's imports: 
//
// import { getTaggedOrDefault } from 'autobahn-core/dist/framework/ioc/getExtensions';

export function searchPage(i: TestController): Search {
    if (!i.ctx.searchPage) {
        i.ctx.searchPage = new Search();
    }

    return i.ctx.searchPage;
}

export function resultPage(i: TestController): Results {
    if (!i.ctx.resultPage) {
        i.ctx.resultPage = new Results();
    }

    return i.ctx.resultPage;
}

export function searchLogic(i: TestController): ISearchLogic {
    if (!i.ctx.searchLogic) {
        i.ctx.searchLogic = getTaggedOrDefault(DuckduckgoContainer, DuckduckgoTestArea.SearchLogic);
    }

    return i.ctx.searchLogic;
}