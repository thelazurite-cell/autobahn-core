/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { injectable } from 'inversify';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import { Project } from '../model/project';
import { Product } from '../model/product';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';
import { LogicModel } from '../model/logic-model';
import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { camelize, kebabize, getImportPath } from '../../helpers/string-helpers';
import { TestArea } from '../model/test-area';
import eslint from 'prettier-eslint';
import eslintOpts from '../../../../.eslintrc';
import prettier from 'prettier';
import { State } from '../../logging/state';

@injectable()
export class LogicModelGenerator extends GeneratorWithProduct {
    generateType: string = 'Logic Model';
    product: Product;
    printer: ts.Printer = ts.createPrinter({ newLine: ts.NewLineKind.CarriageReturnLineFeed });

    async generate(project: Project): Promise<void> {
        let testArea: TestArea;
        let inheritName: string;

        const isNew = await this.shouldGenerateNewModel();
        this.product = await super.getProduct(project);
        const logicModel: LogicModel = new LogicModel();
        let variant = this.product.productName;

        // create project config

        if (isNew) {
            testArea = await super.getTestArea(this.product);
            logicModel.testArea = testArea.areaName;
            const basePath = path.join('src', 'products', this.product.productName, 'business-logic', logicModel.testArea);
            logicModel.variant = variant;
            logicModel.name = camelize(await this.getLogicModelName());
            logicModel.inherits = path.join(basePath, `${kebabize(logicModel.name)}.interface.ts`);
            inheritName = `I${logicModel.name}`;
            logicModel.inheritsName = inheritName;
            logicModel.interfaceName = inheritName;
        } else {
            // create copy of object
            const base = JSON.parse(JSON.stringify(await this.getBaseModel()));
            variant = await this.getVariantToUse(base.variant);
            Object.assign(logicModel, base);
            inheritName = String(logicModel.name);
            logicModel.inherits = logicModel.location;
            logicModel.inheritsName = inheritName;
            logicModel.name = camelize(`${variant}${logicModel.name}`);
        }

        // set up  where the logic model class should be saved
        const basePath = path.join('src', 'products', this.product.productName, 'business-logic', logicModel.testArea);
        State.createMissingDirectories(basePath);
        const logicModelFile = `${kebabize(logicModel.name)}.business-model.ts`;
        logicModel.location = !isNew ? path.join(basePath, variant, logicModelFile) : path.join(basePath, logicModelFile);

        if (!isNew) {
            State.createMissingDirectories(path.join(basePath, variant));
        }

        let spinner;

        const factory = ts.factory;

        // create a new interface if the logic model is not a variant.
        if (isNew) {
            spinner = ora('Creating logic model interface').start();
            const interfaceNodes = [
                factory.createInterfaceDeclaration(
                    undefined,
                    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                    factory.createIdentifier(inheritName),
                    undefined,
                    undefined,
                    []
                )

            ];
            const resultFile = ts.createSourceFile(path.resolve(logicModel.inherits), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
            const result = this.printer.printList(ts.ListFormat.MultiLine, <any>interfaceNodes, resultFile);
            const lmiFile = path.resolve(logicModel.inherits);
            fs.writeFileSync(lmiFile, eslint({
                text: result, eslintConfig: eslintOpts, parser: 'typescript', filePath: lmiFile, parserOptions: { project: [this.tslintPath] }
            }), { encoding: 'utf8' });

            spinner.succeed('Created logic model interface');
        }

        // create new class
        spinner = ora('Create logic model class').start();

        // work out where the interface / inheriting class is in relation to the logic model class.
        const importPath = getImportPath(logicModel.location, logicModel.inherits, false);

        const classNodes = [
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([factory.createImportSpecifier(
                        false,
                        undefined,
                        factory.createIdentifier(inheritName)
                    )])
                ),
                factory.createStringLiteral(importPath),
                undefined
            ),
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([factory.createImportSpecifier(
                        false,
                        undefined,
                        factory.createIdentifier('injectable')
                    )])
                ),
                factory.createStringLiteral('inversify'),
                undefined
            ),
            factory.createClassDeclaration(
                [factory.createDecorator(factory.createCallExpression(
                    factory.createIdentifier('injectable'),
                    undefined,
                    []
                ))],
                [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                factory.createIdentifier(logicModel.name),
                undefined,
                [factory.createHeritageClause(
                    isNew ? ts.SyntaxKind.ImplementsKeyword : ts.SyntaxKind.ExtendsKeyword,
                    [factory.createExpressionWithTypeArguments(
                        factory.createIdentifier(inheritName),
                        undefined
                    )]
                )],
                []
            )
        ];

        // create the logic model class file
        const resultFile = ts.createSourceFile(path.resolve(logicModel.location), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
        const result = this.printer.printList(ts.ListFormat.MultiLine, <any>classNodes, resultFile);
        const lmFile = path.resolve(logicModel.location);
        fs.writeFileSync(lmFile, eslint({
            text: result,
            eslintConfig: eslintOpts,
            parser: 'typescript',
            filePath: lmFile,
            parserOptions: { project: [this.tslintPath] }
        }), { encoding: 'utf8' });

        spinner.succeed('Created logic model class');

        // update IOC container configuration files
        spinner = ora('Updating the IoC container configuration').start();
        // update the test areas configuration IF it is a new file
        if (isNew) {
            const testAreasConfigFile = path.resolve(this.product.testAreaConfig);

            const nodes = [];

            if (fs.existsSync(testAreasConfigFile)) {
                const program = ts.createProgram([testAreasConfigFile], { allowJs: true, removeComments: false });
                const sourceFile = program.getSourceFile(testAreasConfigFile);
                // Loop through the root AST nodes of the file
                ts.forEachChild(sourceFile, node => {
                    if (ts.isVariableStatement(node)) {
                        const statementNodes = node.getChildren(sourceFile);
                        statementNodes.forEach(statementNode => {
                            if (ts.isVariableDeclarationList(statementNode)) {
                                const declarationNodes = statementNode.getChildren(sourceFile);
                                declarationNodes.forEach(declarationNode => {
                                    const constants = declarationNode.getChildren(sourceFile);
                                    constants.forEach(constant => {
                                        const identifiers = constant.getChildren(sourceFile);
                                        identifiers.forEach(identifiers => {
                                            const tokens = identifiers.getChildren(sourceFile);
                                            tokens.forEach(token => {
                                                const properties = token.getChildren(sourceFile);
                                                properties.forEach(property => {
                                                    if (ts.isPropertyAssignment(property)) {
                                                        nodes.push(property);
                                                    }
                                                });
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    }
                });

                nodes.push(factory.createPropertyAssignment(
                    factory.createIdentifier(logicModel.name),
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createIdentifier('Symbol'),
                            factory.createIdentifier('for')
                        ),
                        undefined,
                        [factory.createStringLiteral(logicModel.name)]
                    )
                ));

                const resultNodes = [
                    factory.createVariableStatement(
                        undefined,
                        factory.createVariableDeclarationList(
                            [factory.createVariableDeclaration(
                                factory.createIdentifier(this.product.testAreaName),
                                undefined,
                                undefined,
                                factory.createObjectLiteralExpression(
                                    nodes,
                                    true
                                )
                            )],
                            ts.NodeFlags.Const
                        )
                    ),
                    factory.createExportAssignment(
                        undefined,
                        undefined,
                        undefined,
                        factory.createIdentifier(this.product.testAreaName)
                    )
                ];

                const resultFile = ts.createSourceFile(path.resolve(this.product.testAreaConfig), '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
                const result = this.printer.printList(ts.ListFormat.MultiLine, <any>resultNodes, resultFile);
                const testAreaFile = path.resolve(this.product.testAreaConfig);
                fs.writeFileSync(testAreaFile, eslint({
                    text: result, eslintConfig: eslintOpts, parser: 'typescript', filePath: testAreaFile, parserOptions: { project: [this.tslintPath] }
                }), { encoding: 'utf8' });

            }
        }

        // update the main container 
        const containerFile = path.resolve(this.product.containerConfig);
        const program = ts.createProgram([containerFile], { allowJs: true, removeComments: false });
        const containerSource = program.getSourceFile(containerFile);

        let containerNodes: any = [];

        ts.forEachChild(containerSource, node => {
            containerNodes.push(node);
        });

        const importNodes = [];


        importNodes.push(
            ...[factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([factory.createImportSpecifier(
                        false,
                        undefined,
                        factory.createIdentifier('Container')
                    )])
                ),
                factory.createStringLiteral('inversify'),
                undefined
            ),
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    factory.createIdentifier(this.product.testAreaName),
                    undefined
                ),
                factory.createStringLiteral(getImportPath(this.product.containerConfig, this.product.testAreaConfig, false)),
                undefined
            ),
            factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    factory.createIdentifier(this.product.tagConfigName),
                    undefined
                ),
                factory.createStringLiteral(getImportPath(this.product.containerConfig, this.product.tagConfig, false)),
                undefined
            )]
        );

        if (isNew) {
            importNodes.push(factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                    false,
                    undefined,
                    factory.createNamedImports([factory.createImportSpecifier(
                        false,
                        undefined,
                        factory.createIdentifier(inheritName)
                    )])
                ),
                factory.createStringLiteral(getImportPath(containerFile, logicModel.inherits, false)),
                undefined
            ));
        }

        importNodes.push(factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
                false,
                undefined,
                factory.createNamedImports([factory.createImportSpecifier(
                    false,
                    undefined,
                    factory.createIdentifier(logicModel.name)
                )])
            ),
            factory.createStringLiteral(getImportPath(containerFile, logicModel.location, false)),
            undefined
        ));


        this.product.logicModels.forEach(logicModel => {
            importNodes.push(
                ...[
                    factory.createImportDeclaration(
                        undefined,
                        undefined,
                        factory.createImportClause(
                            false,
                            undefined,
                            factory.createNamedImports([factory.createImportSpecifier(
                                false,
                                undefined,
                                factory.createIdentifier(logicModel.name)
                            )])
                        ),
                        factory.createStringLiteral(getImportPath(containerFile, logicModel.location, false)),
                        undefined
                    ),
                    factory.createImportDeclaration(
                        undefined,
                        undefined,
                        factory.createImportClause(
                            false,
                            undefined,
                            factory.createNamedImports([factory.createImportSpecifier(
                                false,
                                undefined,
                                factory.createIdentifier(logicModel.inheritsName)
                            )])
                        ),
                        factory.createStringLiteral(getImportPath(containerFile, logicModel.inherits, false)),
                        undefined
                    )
                ]
            );
        });


        const configNode =
            factory.createExpressionStatement(factory.createCallExpression(
                factory.createPropertyAccessExpression(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createCallExpression(
                                factory.createPropertyAccessExpression(
                                    factory.createCallExpression(
                                        factory.createPropertyAccessExpression(
                                            factory.createIdentifier(this.product.containerName),
                                            factory.createIdentifier('bind')
                                        ),
                                        [factory.createTypeReferenceNode(
                                            factory.createIdentifier(logicModel.interfaceName),
                                            undefined
                                        )],
                                        [factory.createPropertyAccessExpression(
                                            factory.createIdentifier(this.product.testAreaName),
                                            factory.createIdentifier(isNew ? logicModel.name : logicModel.inheritsName)
                                        )]
                                    ),
                                    factory.createIdentifier('to')
                                ),
                                undefined,
                                [factory.createIdentifier(logicModel.name)]
                            ),
                            factory.createIdentifier('inSingletonScope')
                        ),
                        undefined,
                        []
                    ),
                    factory.createIdentifier('whenTargetTagged')
                ),
                undefined,
                [
                    factory.createPropertyAccessExpression(
                        factory.createIdentifier(this.product.tagConfigName),
                        factory.createIdentifier('product')
                    ),
                    factory.createStringLiteral(isNew ? this.product.productName : `${this.product.productName}.${variant}`)
                ]
            ));


        containerNodes = containerNodes.filter(node => node.kind != 265 && node.kind != 266);
        containerNodes.splice(0, 0, ...importNodes);
        containerNodes.splice(containerNodes.length - 2, 0, configNode);

        const containerResultFile = ts.createSourceFile(path.resolve(this.product.testAreaConfig), '', ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
        const containerResult = this.printer.printList(ts.ListFormat.MultiLineBlockStatements, containerNodes, containerResultFile);

        fs.writeFileSync(containerFile, eslint({
            text: containerResult, eslintConfig: eslintOpts, parser: 'typescript', filePath: containerFile, parserOptions: { project: [this.tslintPath] }
        }), { encoding: 'utf8' });

        spinner.succeed('Updated the IoC container');

        // update project config
        spinner = ora('Updating project configuration').start();
        this.product.logicModels.push(logicModel);
        fs.writeFileSync(path.join(process.cwd(), 'config', 'project.json'), prettier.format(JSON.stringify(project), { parser: 'json' }));
        spinner.succeed('Updated the project configuration');

    }

    async getBaseModel(): Promise<LogicModel> {
        const logicModels = this.product.logicModels.filter(itm => itm.variant === this.product.productName && itm.inherits.endsWith('.interface.ts'));
        const spinner = ora('Finding logic models').start();

        for (const logicModel of logicModels) {
            const resolvedOutput = path.resolve(logicModel.location);
            if (fs.existsSync(resolvedOutput)) {
                const program = ts.createProgram([resolvedOutput], { allowJs: true, removeComments: false });
                const sourceFile = program.getSourceFile(resolvedOutput);

                // Loop through the root AST nodes of the file
                ts.forEachChild(sourceFile, node => {

                    if (ts.isClassDeclaration(node)) {
                        const classDeclaration = node;
                        logicModel.name = classDeclaration.name.text;
                    }
                });
            }
        }

        spinner.succeed('Found logic models');

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                name: 'logicModel',
                message: 'Which logic model should the variant be based on?',
                type: 'autocomplete',
                pageSize: 15,
                highlight: true,
                searchable: true,
                source: (_answers, input) => this.getFuzzyMatch(input, logicModels.map(itm => itm.name))
            }]).then((answer) => {
                resolve(logicModels.filter(itm => itm.name === answer.logicModel)[0]);
            }).catch((err) => reject(err));
        });
    }

    getVariantToUse(excludeVariant: string = null): Promise<string> {
        const variants: string[] = this.product.variants.filter(itm => itm !== excludeVariant);

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                name: 'variant',
                message: 'Which variant do you want to generate for?',
                type: 'autocomplete',
                pageSize: 15,
                highlight: true,
                searchable: true,
                source: (_answers, input) => {
                    return this.getFuzzyMatch(input, variants);
                }
            }]).then(answer => {
                resolve(answer.variant);
            }).catch(e => reject(e));
        });
    }

    private getFuzzyMatch(input: string, dataSource: string[]) {
        return new Promise((res) => {
            const fuzzyResult = fuzzy.filter(input || '', dataSource);

            const data = fuzzyResult.sort(itm => itm.score).map(function (element) {
                return element.original;
            });
            res(data);
        });
    }

    getLogicModelName(): Promise<string> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                name: 'logicName',
                message: 'What should the name of the logic model be?',
                type: 'input',
                validate: (input) => {
                    input = input || '';
                    if (input.trim().length === 0) {
                        return 'You must provide a name.';
                    }

                    return true;
                }
            }]).then(answer => {
                resolve(answer.logicName);
            }).catch(e => reject(e));
        });
    }

    shouldGenerateNewModel(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                name: 'type',
                message: 'What type of logic model do you want to generate?',
                type: 'list',
                choices: ['New', 'Variant']
            }]).then(answer => {
                resolve(answer.type === 'New');
            }).catch(e => reject(e));
        });
    }
}