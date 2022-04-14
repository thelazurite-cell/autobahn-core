import { expect, } from 'chai';
import { Configuration } from '../../../framework/configuration/configuration';

describe('Feature Test Configuration', () => {
    describe('Feature Test Configuration - Happy Path', () => {
        beforeEach(() => {
            Configuration.product = 'unit-testing.hp';
            Configuration.environment = 'all';
        });

        describe('Test Configuration', () => {
            it('Should contain test configuration items', () => {
                expect(Configuration.tests.testConfiguration.length).eql(11);
            });

            it('Should only contain test configuration items', () => {
                const sut = Configuration.tests.testConfiguration;
                const expectedType = 'TestConfigurationItem';

                for (const item of sut) {
                    expect(item.constructor.name).eql(expectedType);
                }
            });

            it('Should contain an expected configuration item', () => {
                const expectedItem = 'Ignore';
                const expectedItemValue = false;
                const expectedItemReason = 'Tests have been set as ignored. Ensure that they should be.';

                const sut = Configuration.tests.testConfiguration.filter(itm => itm.tag === expectedItem)[0];

                expect(sut.shouldRun).eql(expectedItemValue);
                expect(sut.because).eql(expectedItemReason);
            });
        });

        describe('Acceptance Criteria', () => {
            it('Should contain acceptance criteria items', () => {
                expect(Configuration.tests.acceptanceCriteria.acceptanceCriteriaItems.length).eql(2);
            });

            it('Should be able to retrieve an acceptance criteria item', () => {
                const expectedItem = 'ExampleTestTag';
                const expectedItemValue = 'ExampleTestTagValue';

                const sut = Configuration.tests.acceptanceCriteria.getItem(expectedItem);

                expect(sut.tag).eql(expectedItem);
                expect(sut.value).eql(expectedItemValue);
            });

            it('Should be able to retrieve an acceptance criteria value', () => {
                const itemName = 'MaxUploadSizeInMb';
                const expectedItemValue = '20';

                const sut = Configuration.tests.acceptanceCriteria.get(itemName);

                expect(sut).eql(expectedItemValue);
            });
        });
    });

    describe('Feature Test Configuration - Edge Cases', () => {
        describe('Initializing Configuration', () => {
            it("Does not break when a product is not split by a '.' character", () => {
                Configuration.product = 'unit-testing';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).not.to.throw();
                expect(Configuration.tests.testConfiguration.length).eql(11);
                expect(Configuration.tests.acceptanceCriteria.acceptanceCriteriaItems.length).eql(2);
            });

            it('Can use a fallback feature test configuration', () => {
                Configuration.product = 'unit-testing.use-fallback';
                Configuration.environment = 'all';

                const useFallback = true;
                expect(Configuration.reinitialize.bind(Configuration, useFallback)).not.to.throw();
                expect(Configuration.tests.testConfiguration.length).eql(11);
                expect(Configuration.tests.acceptanceCriteria.acceptanceCriteriaItems.length).eql(2);
            });

            it('Should throw an error if no test configuration has been provided', () => {
                Configuration.product = 'unit-testing.no-test-config';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration))
                    .to.throw('The feature configuration did not contain a test configuration with items');
            });

            it('Should throw an error if no ignore tag has been provided', () => {
                Configuration.product = 'unit-testing.no-ignore-tag';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration))
                    .to.throw('The feature configuration did not contain an Ignore tag. Please provide one.');
            });
        });
    });

    describe('Feature Test Configuration - Sad Path', () => {

        it('Should throw an error if the feature test configuration file does not exist', () => {
            Configuration.product = 'unit-testing.no-feature-config';
            Configuration.environment = 'all';

            expect(Configuration.reinitialize.bind(Configuration)).to.throw('No test config found for product');
        });

        it('Should throw an error if JSON format is incorrect', () => {
            Configuration.product = 'unit-testing.feature-format-incorrect';
            Configuration.environment = 'all';

            expect(Configuration.reinitialize.bind(Configuration)).to.throw('There was a problem reading the file located at');
        });

        describe('Test Configuration', () => {
            it('Cannot have a tag without a name', () => {
                Configuration.product = 'unit-testing.no-test-tag';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Test configuration items must have a tag name');
            });

            it("Cannot have a tag without a 'should run' indicator", () => {
                Configuration.product = 'unit-testing.no-shouldRun-indicator';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Test configuration items must have a should run tag');
            });

            it('Cannot allow a tag to be disabled without a reason', () => {
                Configuration.product = 'unit-testing.no-disabled-reason';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Test configuration items must have a reason to be disabled');
            });

            it('Cannot have multiple tags with the same name', () => {
                Configuration.product = 'unit-testing.duplicate-test-tag';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Test Configuration items must have unique names. More than one occurrence of ');
            });
        });

        describe('Acceptance Criteria', () => {
            it('Cannot have acceptance criteria items with no tag name', () => {
                Configuration.product = 'unit-testing.no-tag';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Acceptance Criteria tag name cannot be empty at item');
            });

            it('Cannot have acceptance criteria items with no value', () => {
                Configuration.product = 'unit-testing.no-value';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Acceptance Criteria tag must have a value for');
            });

            it('Cannot have multiple tags with the same name', () => {
                Configuration.product = 'unit-testing.duplicate-acceptance';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration)).to.throw('Acceptance Criteria items must have unique names. More than one occurrence of');
            });

            it('Should throw an error if an acceptance criteria item does not exist after a get attempt', () => {
                Configuration.product = 'unit-testing';
                Configuration.environment = 'all';
                Configuration.reinitialize();
                expect(Configuration.tests.acceptanceCriteria.get.bind(Configuration.tests.acceptanceCriteria, 'MissingItem'))
                    .to.throw('No acceptance criteria item with the name of');
            });

            it('Should throw an error if an acceptance criteria item does not exist after a getItem attempt', () => {
                Configuration.product = 'unit-testing';
                Configuration.environment = 'all';
                Configuration.reinitialize();
                expect(Configuration.tests.acceptanceCriteria.getItem.bind(Configuration.tests.acceptanceCriteria, 'AnotherMissingItem'))
                    .to.throw('No acceptance criteria item with the name of');
            });
        });
    });
});