import { Project } from '../model/project';
import { injectable } from 'inversify';
import { IGenerator } from '../interfaces/generator.interface';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import ts from 'typescript';
import ora from 'ora';
import eslint from 'prettier-eslint';
import eslintOpts from '../../../../.eslintrc';
import prettier from 'prettier';
import { Product } from '../model/product';
import { camelize, getImportPath } from '../../helpers/string-helpers';
import { AppConfiguration } from '../../configuration/app-configuration';
import { FrameworkSettings } from '../../configuration/framework-settings';
import { Sources } from '../../configuration/sources';
import { SourcesType } from '../../configuration/sources-type.enum';
import { FrameworkTestConfiguration } from '../../configuration/framework-test-configuration';
import { TestConfigurationItem } from '../../configuration/test-configuration-item';

type ProductAnswers = {
    productName: string,
    defaultVariant: string,
    environment: string
    ssl: boolean,
    url: string,
    root: string
}

@injectable()
export class ProductGenerator implements IGenerator {
    generateType: string = 'Product';
    tslintPath: string = path.join(__dirname, '..', '..', '..', '..', 'tslint.json');

    answers: ProductAnswers;

    project: Project;
    baseProductPath: string;
    baseConfigPath: string;
    product: Product;

    generate(project: Project): Promise<void> {
        const productNames = project.products.map(itm => itm.productName);
        this.project = project;

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'input',
                name: 'productName',
                message: 'What should the product name be?',
                validate: (input) => {
                    if (productNames.some(product => product.toLowerCase() === input.toLowerCase())) {
                        return 'the product name already exists';
                    }

                    if (input?.trim()?.length === 0 ?? false) {
                        return 'the product name cannot be blank';
                    }

                    return true;
                }
            }, {
                type: 'input',
                name: 'defaultVariant',
                message: 'What should the name of the default variant be? (Leave blank to use the product name)'
            }, {
                type: 'input',
                name: 'environment',
                message: 'What should the name of the first environment be? (i.e. ci, qa, etc)',
                validate: (input) => {
                    const trimmedInput = input.trim();
                    if (!trimmedInput || trimmedInput.length === 0) {
                        return 'You must provide an environment name';
                    }

                    return true;
                }
            }, {
                type: 'confirm',
                name: 'ssl',
                message: 'Should the application use SSL? (HTTPS)',
                default: false
            }, {
                type: 'input',
                name: 'url',
                message: 'What is the product URL? (without http(s)://)',
                validate: (input) => {
                    const trimmedInput = input.trim();
                    if (!trimmedInput || trimmedInput.length === 0) {
                        return 'You must provide a product url';
                    }

                    return true;
                }
            }, {
                type: 'input',
                name: 'root',
                message: 'What is the application root? (leave blank for \'/\')'
            }]).then((answers) => {
                this.answers = answers;
                this.answers.productName = answers.productName.toLowerCase().trim().replace(/ /g, '-');
                this.answers.defaultVariant = answers.defaultVariant.toLowerCase().trim().replace(/ /g, '-');
                this.answers.environment = answers.environment.toLowerCase().trim().replace(/ /g, '-');
                console.log(this.answers);
                this.updateProject();
                this.createFolderStructure();
                this.createConfigurationFiles();
                this.createContainerConfigs();
                resolve();
            }).catch((e) => reject(e));
        });
    }

    createFolderStructure(): void {
        const spinner = ora('Creating folder structure').start();
        fs.mkdirSync(this.baseConfigPath);
        fs.mkdirSync(this.baseProductPath);
        fs.mkdirSync(path.join(process.cwd(), this.product.newmanCollectionPath));
        fs.mkdirSync(path.join(process.cwd(), this.product.baseSpecFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.apiSpecFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.browserSpecFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.baseStepFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.apiStepFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.browserStepFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.basePageObjectFolder));
        fs.mkdirSync(path.join(process.cwd(), this.product.baseLogicFolder));
        spinner.succeed('Created folder structure');
    }

    createConfigurationFiles(): void {
        const defaultShortTimeout = 5000;
        const defaultMidTimeout = 10000;
        const defaultLongTimeout = 60000;
        const spinner = ora('Creating configuration files').start();
        const appConfiguration = new AppConfiguration();

        appConfiguration.ssl = this.answers.ssl;
        appConfiguration.testHost = this.answers.url;
        appConfiguration.applicationRoot = this.answers.root;
        appConfiguration.frameworkConfig = new FrameworkSettings();
        appConfiguration.frameworkConfig.defaultBrowser = 'chrome';
        appConfiguration.frameworkConfig.assertionTimeoutMs = defaultMidTimeout;
        appConfiguration.frameworkConfig.defaultElementTimeoutMs = defaultShortTimeout;
        appConfiguration.frameworkConfig.pageLoadTimeoutMs = defaultLongTimeout;
        appConfiguration.frameworkConfig.ajaxTimeoutMs = defaultLongTimeout;
        appConfiguration.frameworkConfig.pageRequestTimeout = defaultLongTimeout;
        appConfiguration.frameworkConfig.mochaReporters = 'spec';
        appConfiguration.frameworkConfig.testcafeReporters = 'spec';
        appConfiguration.frameworkConfig.sources = [
            {
                locations: [
                    path.join('dist', 'products', this.product.productName, 'specs', 'api', '**', '*.spec.feature'),
                    path.join('dist', 'products', this.product.productName, 'steps', 'api', '**', '*.steps.js')
                ],
                type: SourcesType.api,
                useGherkin: true
            } as Sources,
            {
                locations: [
                    path.join('dist', 'products', this.product.productName, 'specs', 'browser', '**', '*.spec.feature'),
                    path.join('dist', 'products', this.product.productName, 'steps', 'browser', '**', '*.steps.js')
                ],
                type: SourcesType.browser,
                useGherkin: true
            } as Sources,
        ];

        const featureTestConfig = new FrameworkTestConfiguration();
        featureTestConfig.testConfiguration = [{
            'tag': 'Ignore',
            'shouldRun': false,
            'because': 'The test has been marked as ignored. Plase make sure this should be the case.'
        } as TestConfigurationItem];

        fs.writeFileSync(path.join(process.cwd(), this.product.appConfigFiles[0]), prettier.format(JSON.stringify(appConfiguration), { parser: 'json' }));
        fs.writeFileSync(path.join(process.cwd(), this.product.featureConfigFiles[0]), prettier.format(JSON.stringify(featureTestConfig), { parser: 'json' }));

        spinner.succeed('Created configuration files');
    }

    createContainerConfigs(): void {
        const spinner = ora('Creating IoC container configuration').start();
        const factory = ts.factory;
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any

        this.createTagConfig(factory, printer);
        this.createTestAreaConfig(factory, printer);
        this.createIoCContainer(factory, printer);

        spinner.succeed('Created IoC container configuration');
    }

    private createTestAreaConfig(factory: ts.NodeFactory, printer: ts.Printer) {
        const nodes = [
            factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                    [factory.createVariableDeclaration(
                        factory.createIdentifier(this.product.testAreaName),
                        undefined,
                        undefined,
                        factory.createObjectLiteralExpression(
                            [],
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
        const testAreaConfigPath = path.join(process.cwd(), this.product.testAreaConfig);
        this.saveTsFile(testAreaConfigPath, printer, nodes);
    }

    private createTagConfig(factory: ts.NodeFactory, printer: ts.Printer) {
        const nodes = [
            factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                    [factory.createVariableDeclaration(
                        factory.createIdentifier(this.product.tagConfigName),
                        undefined,
                        undefined,
                        factory.createObjectLiteralExpression(
                            [factory.createPropertyAssignment(
                                factory.createIdentifier('product'),
                                factory.createCallExpression(
                                    factory.createPropertyAccessExpression(
                                        factory.createIdentifier('Symbol'),
                                        factory.createIdentifier('for')
                                    ),
                                    undefined,
                                    [factory.createStringLiteral('product')]
                                )
                            )],
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
                factory.createIdentifier(this.product.tagConfigName)
            )
        ];

        const tagConfigPath = path.join(process.cwd(), this.product.tagConfig);
        this.saveTsFile(tagConfigPath, printer, nodes);
    }

    private createIoCContainer(factory: ts.NodeFactory, printer: ts.Printer) {
        const nodes: any = [
            factory.createImportDeclaration(
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
            ),
            factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                    [factory.createVariableDeclaration(
                        factory.createIdentifier(this.product.containerName),
                        undefined,
                        undefined,
                        factory.createNewExpression(
                            factory.createIdentifier('Container'),
                            undefined,
                            []
                        )
                    )],
                    ts.NodeFlags.Const
                )
            ),
            factory.createExportDeclaration(
                undefined,
                undefined,
                false,
                factory.createNamedExports([factory.createExportSpecifier(
                    false,
                    undefined,
                    factory.createIdentifier(this.product.containerName)
                )]),
                undefined,
                undefined
            )
        ];

        const containerConfigPath = path.join(process.cwd(), this.product.containerConfig);
        this.saveTsFile(containerConfigPath, printer, nodes);
    }

    private saveTsFile(filePath: string, printer: ts.Printer, nodes: any) {
        const resultFile = ts.createSourceFile(filePath, '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
        const result = printer.printList(ts.ListFormat.MultiLine, nodes, resultFile);
        fs.writeFileSync(path.resolve(filePath), eslint({
            text: result, eslintConfig: eslintOpts, parser: 'typescript', filePath: filePath, parserOptions: { project: [this.tslintPath] }
        }), { encoding: 'utf8' });
    }

    updateProject(): void {
        this.baseProductPath = path.join(process.cwd(), 'src', 'products', this.answers.productName);
        this.baseConfigPath = path.join(process.cwd(), 'config', this.answers.productName);
        const spinner = ora('Updating project definition').start();
        const product = new Product();
        product.productName = this.answers.productName;
        product.newmanCollectionPath = path.relative(process.cwd(), path.join(this.baseProductPath, 'newman-collections'));
        product.baseConfigPath = path.relative(process.cwd(), this.baseConfigPath);
        product.baseLogicFolder = path.relative(process.cwd(), path.join(this.baseProductPath, 'business-logic'));
        product.containerConfig = path.relative(process.cwd(), path.join(this.baseProductPath, 'business-logic', `${product.productName}.config.ts`));
        product.testAreaConfig = path.relative(process.cwd(), path.join(this.baseProductPath, 'business-logic', `${product.productName}-test-area.config.ts`));
        product.tagConfig = path.relative(process.cwd(), path.join(this.baseProductPath, 'business-logic', `${product.productName}-tags.config.ts`));
        product.basePageObjectFolder = path.relative(process.cwd(), path.join(this.baseProductPath, 'page-object-models'));
        product.baseSpecFolder = path.relative(process.cwd(), path.join(this.baseProductPath, 'specs'));
        product.apiSpecFolder = path.join(product.baseSpecFolder, 'api');
        product.browserSpecFolder = path.join(product.baseSpecFolder, 'browser');
        product.baseStepFolder = path.relative(process.cwd(), path.join(this.baseProductPath, 'steps'));
        product.apiStepFolder = path.join(product.baseStepFolder, 'api');
        product.browserStepFolder = path.join(product.baseStepFolder, 'browser');

        if (this.answers.defaultVariant && this.answers.defaultVariant.length > 0) {
            product.variants.push(this.answers.defaultVariant);
            const variantName = `${product.productName}.${this.answers.defaultVariant}`;
            product.fallbackVariant = variantName;
            product.featureConfigFiles.push(path.relative(process.cwd(), path.join(this.baseConfigPath, `featureTestConfig.${variantName}.json`)));
            product.appConfigFiles.push(path.relative(process.cwd(), path.join(this.baseConfigPath, `appConfig.${variantName}.${this.answers.environment}.json`)));
        } else {
            product.fallbackVariant = product.productName;
            product.featureConfigFiles.push(path.relative(process.cwd(), path.join(this.baseConfigPath, `featureTestConfig.${product.productName}.json`)));
            product.appConfigFiles.push(path.relative(process.cwd(), path.join(this.baseConfigPath, `appConfig.${product.productName}.${this.answers.environment}.json`)));
        }

        const productNameCamelized = camelize(product.productName);
        product.containerName = `${productNameCamelized}Container`;
        product.tagConfigName = `${productNameCamelized}Tags`;
        product.testAreaName = `${productNameCamelized}TestArea`;
        product.environments.push(this.answers.environment);
        this.project.products.push(product);
        this.product = product;
        fs.writeFileSync(path.join(process.cwd(), 'config', 'project.json'), prettier.format(JSON.stringify(this.project), { parser: 'json' }));
        spinner.succeed('Updated project definition');
    }
}