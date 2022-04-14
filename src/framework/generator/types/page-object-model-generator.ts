import { injectable } from 'inversify';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import { Project } from '../model/project';
import inquirer from 'inquirer';
import path from 'path';
import ts from 'typescript';
import fs from 'fs';
import eslint from 'prettier-eslint';
import eslintOpts from '../../../../.eslintrc';
import { TestArea } from '../model/test-area';
import { GlobReader } from '../../gherkin/support/glob-reader';
import { camelize, getImportPath, kebabize } from '../../helpers/string-helpers';
import { State } from '../../logging/state';
import createTestCafe from 'testcafe';
import { GeneratePageObjects } from './GeneratePageObjects';

const fuzzy = require('fuzzy');

@injectable()
export class PageObjectModelGenerator extends GeneratorWithProduct {
    generateType: string = 'Page Object Model';

    async generate(project: Project): Promise<void> {
        const product = await this.getProduct(project);
        const testArea = await this.getTestArea(product);
        const pomName = await this.getPageModelName(testArea);
        let modelLocation = await this.getPageLocation();
        modelLocation = modelLocation.trim().length === 0 ? '/' : modelLocation;
        const className = camelize(pomName);
        const fileName = `${kebabize(pomName)}.page-model.ts`;
        const fullPath = path.join(product.basePageObjectFolder, testArea.areaName);
        const filePath = path.join(fullPath, fileName);

        const factory = ts.factory;

        const generatePomObjects = await this.generatePomObjects();
        if (generatePomObjects) {
            await this.getTypesToFind();

            if (GeneratePageObjects.typesToFind.some(itm => itm === 'iframe')) {
                await this.getIfIframeExclusive();
            }

            const tc = await createTestCafe('localhost');

            try {
                const runner = tc.createRunner();
                const scriptPath = path.resolve(path.join(__dirname, 'pom-generator'));
                const genTest = path.resolve(path.join(__dirname, 'pom-generator', 'placeholder-test.js'));

                const scripts = [
                    { path: path.join(scriptPath, 'finder.js') },
                    { path: path.join(scriptPath, 'iframe-ui.js') }
                ];

                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- needs to be created
                const result = await runner.src([
                    genTest
                ])
                    .browsers(['chrome'])
                    .clientScripts(scripts)
                    .run();
            } finally {
                await tc.close();
            }
        }

        const classProps = [factory.createPropertyDeclaration(
            undefined,
            [factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            factory.createIdentifier('modelLocation'),
            undefined,
            undefined,
            factory.createStringLiteral(modelLocation)
        )];

        for (const element of GeneratePageObjects.objectsNeedGenerating) {
            classProps.push(factory.createPropertyDeclaration(
                undefined,
                [factory.createModifier(ts.SyntaxKind.PublicKeyword)],
                factory.createIdentifier(element.suggestedPropName),
                undefined,
                factory.createTypeReferenceNode(
                    factory.createIdentifier('Locator'),
                    undefined
                ),
                factory.createCallExpression(
                    factory.createIdentifier('$'),
                    undefined,
                    [
                        factory.createStringLiteral(element.id ? element.id : element.cssSelector),
                        factory.createPropertyAccessExpression(
                            factory.createIdentifier('LocatorType'),
                            factory.createIdentifier(element.id ? 'Id' : 'Css')
                        )
                    ]
                )
            ));
        }

        const nodes = [
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([
                        factory.createImportSpecifier(
                            undefined,
                            factory.createIdentifier('$'), null
                        ),
                        factory.createImportSpecifier(
                            undefined,
                            factory.createIdentifier('Locator'), null
                        )
                    ])
                ),
                factory.createStringLiteral(getImportPath(filePath, path.join('src', 'framework', 'driver', 'locators', 'locator.ts')))
            ),
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([factory.createImportSpecifier(
                        undefined,
                        factory.createIdentifier('LocatorType'), null
                    )])
                ),
                factory.createStringLiteral(getImportPath(filePath, path.join('src', 'framework', 'driver', 'locators', 'locator-type.ts')))
            ),
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([factory.createImportSpecifier(
                        undefined,
                        factory.createIdentifier('PageObjectModel'), null
                    )])
                ),
                factory.createStringLiteral(getImportPath(filePath, path.join('src', 'framework', 'driver', 'page-object-model.ts')))
            ),
            factory.createClassDeclaration(
                undefined,
                [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                factory.createIdentifier(className),
                undefined,
                [factory.createHeritageClause(
                    ts.SyntaxKind.ExtendsKeyword,
                    [factory.createExpressionWithTypeArguments(
                        factory.createIdentifier('PageObjectModel'),
                        undefined
                    )]
                )],
                classProps
            )
        ];

        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });

        const resultFile = ts.createSourceFile(filePath, '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
        const result = printer.printList(ts.ListFormat.MultiLine, nodes as any, resultFile);
        State.createMissingDirectories(path.resolve(fullPath));
        fs.writeFileSync(path.resolve(filePath), eslint({
            text: result, eslintConfig: eslintOpts, parser: 'typescript', filePath: path.resolve(filePath), parserOptions: { project: [this.tslintPath] }
        }), { encoding: 'utf8' });
    }
    getIfIframeExclusive(): Promise<void> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'confirm',
                name: 'iframeExclusive',
                message: 'Should the generator only find elements within iframes?',
                default: false
            }]).then((answer) => {
                GeneratePageObjects.iframeOnly = answer.iframeExclusive;
                resolve();
            }).catch(e => reject(e));
        });
    }

    async getTypesToFind(): Promise<void> {
        const types = ['a', 'button', 'p', 'input', 'select', 'label', 'iframe', 'div'];

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'checkbox-plus',
                name: 'typesToGenerate',
                message: 'Pick your output files. Type to search for, or create a file',
                pageSize: 15,
                highlight: true,
                searchable: true,
                source: (_answers: Record<string, string>, input: string) => {
                    return new Promise((res) => {
                        const fuzzyResult = fuzzy.filter(input || '', types);

                        const data = fuzzyResult.sort(itm => itm.score).map(function (element) {
                            return element.original;
                        }) || [];
                        res(data);
                    });

                }
            }]).then((answers) => {
                GeneratePageObjects.typesToFind = answers.typesToGenerate;
                resolve();
            }).catch(e => reject(e));

        });
    }

    async generatePomObjects(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'generatePomObjects',
                'type': 'confirm',
                'message': 'Would you like to generate page objects?'
            }]).then((answer) => {
                resolve(answer.generatePomObjects);
            }).catch(e => reject(e));
        });
    }

    async getPageLocation(): Promise<string> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'modelLocation',
                'type': 'input',
                'message': 'Where is the page located? (without the full url, e.g /Path/To/Page.aspx)'
            }]).then((answer) => resolve(answer.modelLocation))
                .catch(e => reject(e));
        });
    }

    async getPageModelName(testArea: TestArea): Promise<string> {
        const pageObjectModels = [...GlobReader.getTestFiles(testArea.pageObjectModels).map(itm => {
            const forwardSlash = itm.includes('/');
            const split = itm.split(forwardSlash ? '/' : '\\');
            return split[split.length - 1];
        })];

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'pageModelName',
                'type': 'input',
                'message': 'What should the name of the page object model be?',
                'validate': (input) => {
                    input = input || '';
                    const parsed = input.toString().toLowerCase().trim();
                    if (pageObjectModels.includes(`${kebabize(parsed)}.page-model.ts`)) {
                        return 'There is already a page object model with this name';
                    }

                    if (parsed.length === 0) {
                        return 'You must provide a page object model name';
                    }

                    return true;
                }
            }]).then(answer => resolve(answer.pageModelName.trim()))
                .catch(e => reject(e));
        });
    }
}