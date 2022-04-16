import { Container } from 'inversify';
import DuckduckgoTestArea from './duckduckgo-test-area.config';
import DuckduckgoTags from './duckduckgo-tags.config';
import { ISearchLogic } from './search-page/search-logic.interface';
import { SearchLogic } from './search-page/search-logic.business-model';

const DuckduckgoContainer = new Container();

DuckduckgoContainer.bind<ISearchLogic>(DuckduckgoTestArea.SearchLogic)
  .to(SearchLogic)
  .inSingletonScope()
  .whenTargetTagged(DuckduckgoTags.product, 'duckduckgo');

export { DuckduckgoContainer };
