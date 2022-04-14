/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { FilterOptions } from './models/filter-options';
import { GenerationOptions } from './models/generation-options';

export const getMatches = (string: string, regex: RegExp): string[] => {
    return ((string || '').match(regex) || []);
};

export const allowRetryTag = 'AllowRetries';

export const quoteRegex = /(["'`])(?:(?=(\\?))\2.)*?\1/g;


export const getGenerateOptions = (): GenerationOptions => {
    const generateIndex = process.argv.findIndex(val => val === '--generate');
    if (generateIndex !== -1) {
        const options = new GenerationOptions();
        options.appendSteps = process.argv.findIndex(val => val === '--appendSteps') !== -1;
        options.runGenerate = true;
        options.silent = process.argv.findIndex(val => val == '--silent') !== -1;
        const inputIndex = process.argv.findIndex(val => val == '--input');
        options.input = inputIndex !== -1 ? process.argv[inputIndex + 1] : null;
        const outputIndex = process.argv.findIndex(val => val == '--output');
        options.output = outputIndex !== -1 ? process.argv[outputIndex + 1] : null;
        return options;
    }

    return new GenerationOptions();
};

export const getTestFilter = (): FilterOptions => {
    const options = new FilterOptions();
    const filterIndex = process.argv.findIndex(val => val === '--filterTest');

    if (filterIndex !== -1) {
        const filterText = process.argv[filterIndex + 1];
        const parameters = getMatches(filterText, quoteRegex);
        const parameterNames = getParameterNames(filterText, parameters);
        for (let i = 0; i < parameterNames.length; i++) {
            const parameterName = parameterNames[i];
            switch (parameterName.toLowerCase()) {
                case 'testname=':
                    options.testName = new RegExp(parameters[i].slice(1, -1), 'i');
                    break;
                case 'fixturename=':
                    options.fixtureName = new RegExp(parameters[i].slice(1, -1), 'i');
                    break;
            }
        }

        return options;
    }

    return null;
};

export function getParameterNames(filterText: string, parameters: string | string[]): string[] {
    let tmp = String(filterText);
    for (let i = 0; i < parameters.length; i++) {
        tmp = tmp.replace(parameters[i], '');
    }

    return tmp.split('|');
}