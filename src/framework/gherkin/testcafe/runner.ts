const { GeneralError } = require('testcafe/lib/errors/runtime');
const { RUNTIME_ERRORS } = require('testcafe/lib/errors/types');
const TestcafeRunner = require('testcafe/lib/runner');

module.exports = class TypedTestRunner extends TestcafeRunner {
    constructor(...args: never[]) {
        super(...args);
        this.apiMethodWasCalled.tags = false;
        this.apiMethodWasCalled.parameterTypeRegistry = false;
    }

    public tags(...tags: string[]): TypedTestRunner {
        if (this.apiMethodWasCalled.tags) throw new GeneralError(RUNTIME_ERRORS.multipleAPIMethodCallForbidden, 'tags');
        const tagsIdx = process.argv.findIndex(arg => arg === '--tags');
        if (tagsIdx !== -1)
            process.argv.splice(tagsIdx, 2);
        tags = this._prepareArrayParameter(tags);
        process.argv.push('--tags', tags.join(','));
        return this;
    }

    public filterTest(filterText: string): TypedTestRunner {
        if (this.apiMethodWasCalled.filterTest) throw new GeneralError(RUNTIME_ERRORS.multipleAPIMethodCallForbidden, 'filterTest');
        const filterIdx = process.argv.findIndex(arg => arg === '--filterTest');
        if (filterIdx !== -1)
            process.argv.splice(filterIdx, 2);
        process.argv.push('--filterTest', filterText);
        return this;
    }

    public parameterTypeRegistryFile(parameterTypeRegistryFilePath: string): TypedTestRunner {
        if (this.apiMethodWasCalled.parameterTypeRegistry)
            throw new GeneralError(RUNTIME_ERRORS.multipleAPIMethodCallForbidden, 'parameterTypeRegistry');

        process.argv.push('--param-type-registry-file', parameterTypeRegistryFilePath);
        this.apiMethodWasCalled.parameterTypeRegistry = true;

        return this;
    }

    dryRun(enabled: boolean) {
        if (this.apiMethodWasCalled.dryRun) {
            throw new GeneralError(RUNTIME_ERRORS.multipleAPIMethodCallForbidden, 'dryRun');
        }

        if (enabled) {
            process.argv.push('--dry-run');
        }

        this.apiMethodWasCalled.dryRun = true;

        return this;
    }

    generate(input: string, output: string, append: boolean, silent = false) {
        if (this.apiMethodWasCalled.generate) {
            throw new GeneralError(RUNTIME_ERRORS.multipleAPIMethodCallForbidden, 'generate');
        }

        process.argv.push('--generate');
        if (append) {
            process.argv.push('--appendSteps');
        }

        process.argv.push('--input', input);
        process.argv.push('--output', output);
        if (silent) {
            process.argv.push('--silent');
        }

        this.apiMethodWasCalled.generate = true;

        return this;
    }
};
