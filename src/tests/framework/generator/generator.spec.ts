import { Configuration } from '../../../framework/configuration/configuration';

describe('Generator Class', () => {
    beforeEach(() => {
        Configuration.product = 'unit-testing';
        Configuration.environment = 'all';
    });
});