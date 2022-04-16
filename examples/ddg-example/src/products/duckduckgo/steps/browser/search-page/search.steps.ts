import { Given, When, Then } from '@cucumber/cucumber';
import { searchLogic } from '../../../business-logic/search-page/search.functions';

Given(
  /^I have entered '(.*)' as the search term$/,
  async (i: TestController, [searchTerm]) => {
    await searchLogic(i).enterSearchTerm(i, searchTerm);
  }
);

When(/^I am on the results page$/, async (i: TestController) => {
  await searchLogic(i).onResultsPage(i);
});

Then(
  /^I should see a result with a title of '(.*)'$/,
  async (i: TestController, [expectedTitle]) => {
    await searchLogic(i).shouldSeeResult(i, expectedTitle);
  }
);

Given(/^I am on the homepage$/, async (i: TestController) => {
  await searchLogic(i).onSearchPage(i);
});
