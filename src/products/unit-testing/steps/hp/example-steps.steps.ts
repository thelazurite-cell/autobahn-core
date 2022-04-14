import { Given, When, Then } from '@cucumber/cucumber';

Given(/^I am using an example configuration file$/, (i: TestController) => {
    console.log(i);
});

When(/^I am testing that the framework is sane$/, (i: TestController) => {
    console.log(i);
});

Then(/^I should be able to get the result$/, (i: TestController) => {
    console.log(i);
});