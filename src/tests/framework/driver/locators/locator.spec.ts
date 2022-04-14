import { expect } from 'chai';
import { $ } from '../../../../framework/driver/locators/locator';
import { LocatorType } from '../../../../framework/driver/locators/locator-type';

describe('Locator Helper Class', () => {
    describe('Creating a new locator', () => {
        it('Should default to ID if no LocatorType was provided', () => {
            const locator = $('textValue');
            expect(locator.type).to.equal(LocatorType.Id);
        });

        it("Shouldn't overwrite the locator type if it has been provided", () => {
            const locator = $('textValue', LocatorType.Css);
            expect(locator.type).to.equal(LocatorType.Css);
        });
    });
});