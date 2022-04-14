const CliArgumentParser = require('testcafe/lib/cli/argument-parser');

module.exports = class TypedCliArgumentParser extends CliArgumentParser {
    _describeProgram() {
        super._describeProgram();

        this.program._name = 'autobahn';

        this.program.option(
            '--tags <tag[,tag2,...]>',
            'specify a list of tags to filter the tests by. Negate tags with ~ to exclude all scenarios with that tag',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (val: any) => (val ? val.split(',') : val)
        );

        this.program.option(
            '--param-type-registry-file <file path>',
            'Relative path to a file that exports a "cucumberExpressions.ParameterTypeRegistry" object'
        );
    }
};
