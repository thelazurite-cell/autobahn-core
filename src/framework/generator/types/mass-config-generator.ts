import { Project } from '../model/project';
import { injectable } from 'inversify';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { Product } from '../model/product';
import { Configuration } from '../../configuration/configuration';


@injectable()
export abstract class MassConfigGenerator extends GeneratorWithProduct {
    abstract generate(project: Project): Promise<void>;

    protected currentEnvAuto(product: Product, currentConfig: string): void {
        const configPath = path.join(product.baseConfigPath, currentConfig);
        product.appConfigFiles.push(configPath);
        fs.writeFileSync(path.resolve(configPath), prettier.format(JSON.stringify(Configuration.application), { parser: 'json' }));
    }

    protected async currentEnvInteractive(newVariant: string, environment: string, urlPattern: string, rootPattern: string, product: Product, configPath: string): Promise<any> {
        const usesSsl = await this.getUsesSsl(newVariant, environment);
        let url: string;
        let root: string;

        if (!urlPattern) {
            url = await this.getUrl();
            root = await this.getRoot(newVariant, environment);

            if (root.trim().length === 0) {
                root = '/';
            }

            url = url.toString().toLowerCase();
            if (url.includes('{{variant}}') && url.includes('{{env}}')) {
                urlPattern = url;
                rootPattern = root;
            }
        } else {
            url = urlPattern;
            root = rootPattern;
        }

        Configuration.application.ssl = usesSsl;
        Configuration.application.testHost = url.replace('{{variant}}', newVariant).replace('{{env}}', environment);
        Configuration.application.applicationRoot = root;

        product.appConfigFiles.push(configPath);
        fs.writeFileSync(path.resolve(configPath), prettier.format(JSON.stringify(Configuration.application), { parser: 'json' }));
        return { urlPattern, rootPattern };
    }

    protected saveProject(project: Project): void {
        fs.writeFileSync(path.resolve(path.join(process.cwd(), 'config', 'project.json')), prettier.format(JSON.stringify(project), { parser: 'json' }));
    }

    getUsesSsl(variant: string, environment: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'confirm',
                name: 'ssl',
                message: `Should ${variant} (${environment}) use SSL? (HTTPS)`,
                default: true
            }]).then((result) => resolve(result.ssl))
                .catch((e) => reject(e));
        });
    }

    getUrl(): Promise<string> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'input',
                name: 'url',
                message: 'What is the product URL? (without http(s)://, you can use {{variant}} && {{env}})',
                validate: (input) => {
                    const trimmedInput = input.trim();
                    if (!trimmedInput || trimmedInput.length === 0) {
                        return 'You must provide a product url';
                    }

                    return true;
                }
            }]).then((result) => resolve(result.url))
                .catch((e) => reject(e));
        });
    }

    getRoot(variant: string, environment: string): Promise<string> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'input',
                name: 'root',
                message: `What is the application root for ${variant} (${environment})? (leave blank for '/')`
            }]).then((result) => resolve(result.root))
                .catch((e) => reject(e));
        });
    }

    getShouldInputEnvDetails(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'inputInfo',
                'type': 'confirm',
                'message': 'Would you like to input the environment information?',
                'default': true
            }]).then(result => resolve(result.inputInfo))
                .catch(e => reject(e));
        });
    }
}
