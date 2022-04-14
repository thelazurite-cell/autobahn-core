import { expect } from 'chai';
import { Configuration } from '../../../framework/configuration/configuration';

describe('Application Configuration', () => {
    describe('Application - Happy Path', () => {
        beforeEach(() => {
            Configuration.product = 'unit-testing.hp';
            Configuration.environment = 'all';
            Configuration.reinitialize();
        });

        it('Should be the expected class type', () => {
            const sut = Configuration.application;
            const expectedType = 'AppConfiguration';

            expect(sut.constructor.name).to.eql(expectedType);
        });

        it('Should contain a framework config', () => {
            const sut = Configuration.application.frameworkConfig;
            const expectedType = 'FrameworkSettings';

            expect(!sut).eql(false);
            expect(sut.constructor.name).to.eql(expectedType);
        });

        it('can contain a database connections dictionary', () => {
            const sut = Configuration.application.dataConnections;
            const expectedType = 'Dictionary';

            expect(!sut).eql(false);
            expect(sut.constructor.name).to.eql(expectedType);
        });

        it('It can contain an application details dictionary', () => {
            const sut = Configuration.application.dataConnections;
            const expectedType = 'Dictionary';

            expect(!sut).eql(false);
            expect(sut.constructor.name).to.eql(expectedType);
        });

        it('Should be able to retrieve a data connection', () => {
            const expectedItem = 'exampleConnectionString';
            const expectedItemValue = 'Data Source=(hoaxaldb)\\AnyDBName;Initial Catalog=ThisDoesntExist;Persist Security Info=True;Pooling=true';

            const sut = Configuration.application.getDataConnection(expectedItem);
            expect(sut).to.eql(expectedItemValue);
        });

        it('Should be able to get an application detail', () => {
            const expectedItem = 'exampleDetails';
            const expectedItemValue = 'foo';

            const sut = Configuration.application.getAppDetail(expectedItem);
            expect(sut).to.eql(expectedItemValue);
        });

        it('Should be able to retrieve testHost from env var', () => {
            const expectedItem = 'testHost';
            const expectedItemValue = 'http://localhost-from-env-var';

            const expectedItemKey = (`appconfig_${expectedItem}`).toUpperCase();
            process.env[expectedItemKey] = expectedItemValue;
            Configuration.reinitialize();

            const sut = Configuration.application.testHost;

            expect(sut).to.eq(expectedItemValue);
        });

        it('Should be able to retrieve an application detail from env var', () => {
            const expectedItem = 'exampleDetails';
            const expectedItemValue = 'foobar-env';

            const expectedItemKey = (`appconfig_${expectedItem}`).toUpperCase();
            process.env[expectedItemKey] = expectedItemValue;
            Configuration.reinitialize();

            const sut = Configuration.application.getAppDetail(expectedItem);

            expect(sut).to.eq(expectedItemValue);
        });

        it('Should be able to retrieve a data connection from env var', () => {
            const expectedItem = 'exampleConnectionString';
            const expectedItemValue = 'Data Source=(hoaxaldb)\\AnyDBName;Initial Catalog=ThisDoesntExist;Persist Security Info=True;Pooling=true';

            const expectedItemKey = (`appconfig_${expectedItem}`).toUpperCase();
            process.env[expectedItemKey] = expectedItemValue;
            Configuration.reinitialize();

            const sut = Configuration.application.getDataConnection(expectedItem);

            expect(sut).to.eq(expectedItemValue);
        });
    });

    describe('Application - Sad Path', () => {
        describe('Framework config', () => {
            it('Should throw an error message if the framework config is missing', () => {
                Configuration.product = 'unit-testing.no-framework';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should contain the framework configuration element');
            });
        });

        describe('Framework timeouts', () => {
            it('Should have a page load timeout should be a positive number > 0', () => {
                Configuration.product = 'unit-testing.invalid-page-load';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should contain a vaild page load timeout');
            });

            it('Should have an AJAX timeout should where it is a positive number > 0', () => {
                Configuration.product = 'unit-testing.invalid-ajax-timeout';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should contain a valid AJAX timeout');
            });

            it('Should have a default element timeout where it is a positive number > 0', () => {
                Configuration.product = 'unit-testing.invalid-default-timeout';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should contain a valid default element timeout');
            });

            it('Should have an assertion timeout where it is a positive number > 0', () => {
                Configuration.product = 'unit-testing.invalid-assertion-timeout';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should contain a valid assertion timeout');
            });
        });

        describe('Framework Behaviour Definitions', () => {
            it('Should define a report type', () => {
                Configuration.product = 'unit-testing.no-report-type';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should contain a report type');
            });

            it('Should state the amount of parallel threads to use, and should be at least 1', () => {
                Configuration.product = 'unit-testing.invalid-parallel-threads';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application configuration should have a valid number of parallel threads');
            });

            it('Should state the test speed and should be at least 0.01', () => {
                Configuration.product = 'unit-testing.state-test-speed-too-low';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application test speed is under the minimum of 0.01');
            });

            it('Should not have a test speed greater than 1', () => {
                Configuration.product = 'unit-testing.state-test-speed-too-high';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application test speed is over the maximum of 1');
            });

            it('Should state the maximum amount of test attempts and be at least 1', () => {
                Configuration.product = 'unit-testing.invalid-max-attempts';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application test attempts should be at least 1');
            });
        });

        describe('Database sources', () => {
            it("Should throw an exception when attempting to get a data connection that doesn't exist", () => {
                const dataSearchValue = 'nonExistantValue';

                Configuration.product = 'unit-testing.hp';
                Configuration.environment = 'all';
                Configuration.reinitialize(usesFallbackFeatureConfig());

                expect(Configuration.application.getDataConnection.bind(Configuration.application, dataSearchValue))
                    .to.throw('Could not find a database connection with a name of');
            });

            describe('No database connections element', () => {
                beforeEach(() => {
                    Configuration.product = 'unit-testing.no-db-connections';
                    Configuration.environment = 'all';
                });

                it('Should not throw an exception if the data connections element does not exist', () => {
                    expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig())).not.to.throw();
                });

                it("Should throw an exception if attempting to get a database connection when the element doesn't exist", () => {
                    const dataSearchValue = 'exampleDataConnection';

                    Configuration.reinitialize(usesFallbackFeatureConfig());

                    expect(Configuration.application.getDataConnection.bind(Configuration.application, dataSearchValue))
                        .to.throw('Could not find a database connection with a name of');
                });
            });
        });

        describe('Test Sources', () => {
            it('Should have a framework config with a sources array', () => {
                Configuration.product = 'unit-testing.no-sources';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Application Configuration must contain a sources array');
            });

            it('Should have a framework config with at least one element', () => {
                Configuration.product = 'unit-testing.sources-no-entries';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('The sources array must contain at least one element');
            });

            it('Should have a sources type', () => {
                Configuration.product = 'unit-testing.sources-type-missing';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('Sources item must contain a type');
            });

            it('Should throw an error if the source type is invalid', () => {
                Configuration.product = 'unit-testing.sources-type-invalid';
                Configuration.environment = 'all';

                expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig()))
                    .to.throw('The sources type is invalid');
            });
        });

        describe('Application Details', () => {
            it("Should throw an exception when attempting to get an application detail that doesn't exist", () => {
                const dataSearchValue = 'nonExistValue';

                Configuration.product = 'unit-testing.hp';
                Configuration.environment = 'all';
                Configuration.reinitialize(usesFallbackFeatureConfig());

                expect(Configuration.application.getAppDetail.bind(Configuration.application, dataSearchValue))
                    .to.throw('Could not find an application detail with a name of');
            });

            describe('No application details element', () => {
                beforeEach(() => {
                    Configuration.product = 'unit-testing.no-app-details';
                    Configuration.environment = 'all';
                });

                it('Should not throw an exception if the app details element does not exist', () => {
                    expect(Configuration.reinitialize.bind(Configuration, usesFallbackFeatureConfig())).not.to.throw();
                });

                it("Should throw an exception if attempting to get a app detail when the element doesn't exist", () => {
                    const dataSearchValue = 'portalIdentifier';

                    Configuration.reinitialize(usesFallbackFeatureConfig());

                    expect(Configuration.application.getAppDetail.bind(Configuration.application, dataSearchValue))
                        .to.throw('Could not find an application detail with a name of');
                });
            });

        });
    });
});

function usesFallbackFeatureConfig(): boolean {
    return true;
}
