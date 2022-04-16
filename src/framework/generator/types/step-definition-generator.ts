/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/prefer-for-of */
// working with any is required while working with the compiler api
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Project } from '../model/project';
import { injectable } from 'inversify';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import { ConsoleColor } from '../../helpers/console-color.enum';
import { GlobReader } from '../../gherkin/support/glob-reader';
import { getMatches, quoteRegex } from '../../gherkin/support/helper-functions';
import { Feature } from '../../gherkin/support/models/feature';
import { GherkinProcessor } from '../../gherkin/support/gherkin-processor';
import { Configuration } from '../../configuration/configuration';
import TestcafeTypescriptCompiler from 'testcafe/lib/compiler/test-file/formats/typescript/compiler';
import TestcafeESNextCompiler from 'testcafe/lib/compiler/test-file/formats/es-next/compiler';
import format from 'prettier-eslint';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';
import ora from 'ora';
import fs from 'fs';
import path, { join } from 'path';
import boxen from 'boxen';
import ts from 'typescript';
import eslintOpts from '../../../../.eslintrc';
import { Product } from '../model/product';
import { TestArea } from '../model/test-area';
import { SourcesType } from '../../configuration/sources-type.enum';
import { State } from '../../logging/state';
import { getImportPath } from '../../helpers/string-helpers';
import { GeneratorCli } from '../generator-cli';

type StepGenerationMeta = {
    order: number,
    text: string,
    hasParameters: boolean,
    parameters: string[],
    fileName: string,
    outputFile: string
};

@injectable()
export class StepDefinitionsGenerator extends GeneratorWithProduct {
    project: Project;

    generateType: string = 'Step Definitions';

    gherkinBehavior: GherkinProcessor;

    steps: string[] = [];

    specs: string[] = [];

    constructor() {
        super();
    }

    async generate(project: Project): Promise<void> {
        this.project = project;

        const product = await this.getProduct(project);
        const area = await this.getTestArea(product);
        this.steps = [];
        product.testAreas.forEach(
            testArea => this.steps.push(
                ...GlobReader.getTestFiles(
                    testArea.steps, false
                )
            )
        );

        const compiledSteps = [];
        Configuration.application.frameworkConfig.sources.map(itm => itm.locations)
            .forEach(itm => {
                const fullGlob = itm.map(itm => join(process.cwd(), itm));
                console.log(fullGlob);
                compiledSteps.push(
                    ...GlobReader.getTestFiles(
                        fullGlob.filter(
                            val => val.toLowerCase().endsWith('.steps.js')
                        )
                    ));

                console.log(compiledSteps);
            }
            );

        const specs = area.specs.map(itm => path.join(process.cwd(), itm));

        this.specs = GlobReader.getTestFiles(specs);

        console.log(this.specs);

        this.gherkinBehavior = new GherkinProcessor(this.specs, compiledSteps);
        let outputFiles = null;
        while (!outputFiles || outputFiles?.length === 0) {
            outputFiles = await this.pickOutputFiles(product, area);
            if (!outputFiles || outputFiles?.length === 0) {
                console.log(`${ConsoleColor.FgRed}You must provide at least one output file!`);
            }
        }

        await this.performGenerate(this.specs, outputFiles, area);
    }

    private pickOutputFiles(product: Product, area: TestArea): Promise<string[]> {

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'checkbox-plus',
                name: 'files',
                message: 'Pick your output files. Type to search for, or create a file',
                pageSize: 15,
                highlight: true,
                searchable: true,
                source: (_answers: Record<string, string>, input: string) => {
                    return new Promise((res) => {
                        const fuzzyResult = fuzzy.filter(input || '', this.steps);

                        const data = fuzzyResult.sort(itm => itm.score).map(function (element) {
                            return element.original;
                        }) || [];
                        if (input.replace(/\./g, '').trim().length > 0)
                            data.push(`${ConsoleColor.FgGreen}create "${input}"${ConsoleColor.Reset}`);
                        res(data);
                    });

                }
            }]).then((answers) => {
                const parsed = [];
                for (let i = 0; i < answers.files.length; i++) {
                    const value: string = answers.files[i];
                    const createPrefix = '\u001b[32mcreate "';
                    const createSuffix = '"\u001b[0m';
                    if (value.startsWith(createPrefix)) {
                        const fileName = value.replace(createPrefix, '').replace(createSuffix, '').split('.');
                        const fileDir = path.join(area.sourceType === SourcesType.browser ? product.browserStepFolder : product.apiStepFolder, area.areaName);
                        State.createMissingDirectories(path.resolve(fileDir));
                        const filePath = path.join(fileDir, `${fileName[0]}.steps.ts`);
                        parsed.push(filePath);
                    } else {
                        parsed.push(value);
                    }
                }

                resolve(parsed);
            }).catch(e => reject(e));

        });
    }

    private async performGenerate(inputFiles: string[], outputFiles: string[], area: TestArea) {
        let spinner = ora('Loading step definitions').start();
        await this.gherkinBehavior.loadStepDefinitions([new TestcafeESNextCompiler(), new TestcafeTypescriptCompiler()])
            .then(() => spinner.succeed('Loaded step definitions'))
            .catch((e) => { spinner.fail('Couldn\'t load step definitions'); console.log(e); });

        spinner = ora(`Loading feature file 1/${inputFiles.length}`).start();
        const specs = [];

        for (let i = 0; i < inputFiles.length; i++) {
            spinner.text = `Loading feature file ${i + 1}/${inputFiles.length}`;
            const spec = await this.gherkinBehavior.loadSpec(inputFiles[i]).catch(e => {
                spinner.fail(`Couldn't load feature file '${inputFiles[i]}'`);
                throw e;
            });
            specs.push(spec);
        }

        spinner.succeed('Loaded feature files');

        spinner = ora('Finding missing steps').start();

        const features: Feature[] = [];
        for (let i = 0; i < specs.length; i++) {
            features.push(this.gherkinBehavior.processFeature(specs[i]));
        }

        const missingSteps = [];

        if (features.every(feature => feature.missingFeatureSteps.length === 0)) {
            spinner.warn('There are no steps to generate');
            return Promise.resolve();
        } else {
            let ordered = 0;
            for (let featureIter = 0; featureIter < features.length; featureIter++) {
                const feature: Feature = features[featureIter];
                for (let stepIter = 0; stepIter < feature.missingFeatureSteps.length; stepIter++) {
                    let text = feature.missingFeatureSteps[stepIter].replace(/</g, '\\<').replace(/>/g, '\\>');
                    const parameters = getMatches(text, quoteRegex);
                    const hasParameters = parameters.length > 0;
                    for (let i = 0; i < parameters.length; i++) {
                        const param = parameters[i];
                        const quoteType = param[0];
                        text = text.replace(param, quoteType + '(.*)' + quoteType);
                    }

                    if (missingSteps.every(itm => itm.text !== text)) {

                        missingSteps.push({ order: Number(ordered), text, hasParameters, parameters, fileName: feature.fileName, outputFile: '' });
                        ordered++;
                    }
                }
            }

            spinner.succeed('Found missing steps');
        }

        await this.getStepsToGenerate(outputFiles, missingSteps);

        spinner = ora('Generating Steps...\n').start();
        let spinnerIndent: ora.Ora;
        const resolvedOutputFiles = outputFiles.map(itm => path.resolve(itm));
        const generatedSteps = [];
        for (let outputIter = 0; outputIter < resolvedOutputFiles.length; outputIter++) {
            const resolvedOutput = resolvedOutputFiles[outputIter];
            const currentSteps = missingSteps.filter((itm: StepGenerationMeta) => itm.outputFile === resolvedOutput);
            if (currentSteps.length === 0) continue;

            const sourceNodes: any[] = [];
            if (fs.existsSync(resolvedOutput)) {

                const program = ts.createProgram([resolvedOutput], { allowJs: true, removeComments: false });
                const sourceFile = program.getSourceFile(resolvedOutput);

                let foundCucumberModule = false;
                // Loop through the root AST nodes of the file
                ts.forEachChild(sourceFile, node => {

                    if (ts.isImportDeclaration(node)) {
                        const module = node.moduleSpecifier['text'];
                        if (module === this.project.cucumberProvider) {
                            foundCucumberModule = true;
                            node = this.updateCucumberImport(node);
                        }
                    }

                    sourceNodes.push(node);
                    // console.log(node);
                });

                if (!foundCucumberModule) {
                    sourceNodes.unshift(
                        this.createCucumberImport()
                    );
                }
            } else {
                sourceNodes.push(this.createCucumberImport());
                if (area.sourceType === SourcesType.api) {
                    const factory = ts.factory;
                    sourceNodes.push(

                        factory.createImportDeclaration(
                            undefined,
                            undefined,
                            factory.createImportClause(
                                false,
                                undefined,
                                factory.createNamedImports([factory.createImportSpecifier(
                                    false,
                                    undefined,
                                    factory.createIdentifier('MochaController')
                                )])
                            ),
                            //   factory.createStringLiteral("../../../../framework/gherkin/mocha/mocha-controller")
                            factory.createStringLiteral(getImportPath(resolvedOutput, path.join(...GeneratorCli.importRoot, 'framework', 'gherkin', 'mocha', 'mocha-controller.ts')))
                        )
                    );
                }
            }

            // const resolvedFile = resolvedOutput.split(path.sep);
            for (let stepIter = 0; stepIter < currentSteps.length; stepIter++) {
                const step: StepGenerationMeta = currentSteps[stepIter];
                const data = fs.readFileSync(path.resolve(step.fileName), 'utf-8').split(/\r?\n/);

                const parameters = getMatches(step.text, quoteRegex);
                const hasParameters = parameters.length > 0;
                let regex = String(step.text);
                for (let i = 0; i < parameters.length; i++) {
                    const param = parameters[i];
                    const quoteType = param[0];
                    regex = regex.replace(param, quoteType + '(.*)' + quoteType);
                }

                if (!generatedSteps.includes(regex)) {
                    spinnerIndent = ora(`Generating '${regex}'`);
                    spinnerIndent.indent = 1;
                    spinnerIndent.start();
                    const indexOfStep = data.indexOf(data.filter(itm => new RegExp(`(Given|When|Then|And|But) ${regex}`).exec(itm.trim()))[0]);
                    let line = data[indexOfStep].toString().replace(step.text, '').trim();
                    let stepType = '';
                    if (line.startsWith('And') || line.startsWith('But')) {
                        for (let i = indexOfStep; i > 0; i--) {
                            line = data[i].trim();
                            if (line.startsWith('And') || line.startsWith('But')) {
                                continue;
                            }

                            break;
                        }
                    }

                    stepType = this.getPreferredStepType(line, stepType);
                    const arrayParameters = [];
                    for (let i = 0; i < parameters.length; i++) {
                        arrayParameters.push(ts.factory.createBindingElement(undefined, undefined, ts.factory.createIdentifier(`p${i}`), undefined));
                    }

                    sourceNodes.push(this.generateStep(stepType, regex, hasParameters, arrayParameters, area));

                    generatedSteps.push(regex);
                    spinnerIndent.succeed(`Generated Step '${regex}'`);
                }
            }

            const resultFile = ts.createSourceFile(resolvedOutput, '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
            const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });
            const result = printer.printList(ts.ListFormat.MultiLine, <any>sourceNodes, resultFile);
            fs.writeFileSync(path.resolve(resolvedOutput), format({
                text: result, eslintConfig: eslintOpts, parser: 'typescript', filePath: resolvedOutput
            }), { encoding: 'utf8' });
        }

        console.log();
        spinner.succeed('Generation Complete!');
        console.log(boxen(resolvedOutputFiles.join('\n'), { borderColor: 'green', borderStyle: 'single' }));
    }

    private generateStep(stepType: string, regex: string, hasParameters: boolean, arrayParameters: any[], area: TestArea) {
        return ts.factory.createExpressionStatement(ts.factory.createCallExpression(
            ts.factory.createIdentifier(stepType),
            undefined,
            [
                ts.factory.createRegularExpressionLiteral(`/^${regex}$/`),
                ts.factory.createArrowFunction(
                    [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
                    undefined,
                    hasParameters ?
                        [
                            ts.factory.createParameterDeclaration(
                                undefined,
                                undefined,
                                undefined,
                                ts.factory.createArrayBindingPattern([
                                    ...arrayParameters
                                ]),
                                undefined,
                                undefined,
                                undefined
                            ),
                            this.testControllerParam(area)
                        ]
                        : [this.testControllerParam(area)],
                    undefined,
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    ts.factory.createBlock(
                        [ts.factory.createExpressionStatement(ts.factory.createAwaitExpression(ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier('i'),
                                ts.factory.createIdentifier('debug')
                            ),
                            undefined,
                            []
                        )))],
                        true
                    )
                )
            ]
        )
        );
    }

    private testControllerParam(area: TestArea): ts.ParameterDeclaration {
        return ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            ts.factory.createIdentifier('i'),
            undefined,
            ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier(area.sourceType === SourcesType.browser ? 'TestController' : 'MochaController'),
                undefined
            ),
            undefined
        );
    }

    private updateCucumberImport(node: ts.Node) {
        node = ts.factory.updateImportDeclaration(<any>node,
            undefined,
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports([
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('Given')),
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('When')),
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('Then'))
                ])
            ),
            ts.factory.createStringLiteral(this.project.cucumberProvider),
            undefined
        );

        return node;
    }

    private createCucumberImport(): any {
        return ts.factory.createImportDeclaration(
            undefined,
            undefined,
            ts.factory.createImportClause(
                false,
                undefined,
                ts.factory.createNamedImports([
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('Given')),
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('When')),
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('Then'))
                ])
            ),
            ts.factory.createStringLiteral(this.project.cucumberProvider),
            undefined
        );
    }

    private getStepsToGenerate(outputFiles: string[], missingSteps: StepGenerationMeta[]): Promise<void> {
        const stepCharLimit = 30;
        return new Promise((resolve, reject) => {
            inquirer
                .prompt([
                    {
                        type: 'table',
                        name: 'stepsToGenerate',
                        message: 'Choose the steps you want to generate',
                        pageSize: 10,
                        columns: [
                            ...outputFiles.map(itm => {
                                const spl = itm.split(path.sep);
                                return { name: spl[spl.length - 1], value: itm };
                            }),
                            {
                                name: 'None',
                                value: undefined
                            }
                        ],
                        rows: missingSteps.map(itm => { return { name: itm.text.length > stepCharLimit ? `${itm.text.toString().substring(0, stepCharLimit)}...` : itm.text, value: itm.order }; })
                    }
                ])
                .then((answers) => {
                    for (let i = 0; i < missingSteps.length; i++) {
                        const stepOutput = answers.stepsToGenerate[i];
                        missingSteps[i].outputFile = stepOutput ? path.resolve(stepOutput) : undefined;
                    }

                    resolve();
                })
                .catch(e => reject(e));
        });
    }

    private getPreferredStepType(line: string, stepType: string) {
        if (line.startsWith('Given')) {
            stepType = 'Given';
        } else if (line.startsWith('When')) {
            stepType = 'When';
        } else if (line.startsWith('Then')) {
            stepType = 'Then';
        }

        return stepType;
    }
}
