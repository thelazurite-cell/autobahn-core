import { Project } from '../model/project';
import { injectable } from 'inversify';
import { MassConfigGenerator } from './mass-config-generator';
import inquirer from 'inquirer';
import path from 'path';
import { Product } from '../model/product';
import { Configuration } from '../../configuration/configuration';

@injectable()
export class EnvironmentGenerator extends MassConfigGenerator {
    generateType: string = 'Environment';

    async generate(project: Project): Promise<void> {
        const product = await this.getProduct(project);
        const newEnvironment = await this.getEnvironmentToGenerate(product);
        const type = product.variants;

        const inputEnvInfo = await this.getShouldInputEnvDetails();

        if (!inputEnvInfo) {
            for (const variant of type) {
                Configuration.product = `${product.productName}.${variant}`;
                Configuration.reinitialize();
                const currentConfig = `appConfig.${product.productName}.${variant}.${newEnvironment}.json`;
                this.currentEnvAuto(product, currentConfig);
            }
        } else {
            let urlPattern: string;
            let rootPattern: string;
            for (const variant of type) {
                Configuration.product = `${product.productName}.${variant}`;
                Configuration.reinitialize();
                const currentConfig = `appConfig.${product.productName}.${variant}.${newEnvironment}.json`;
                const configPath = path.join(product.baseConfigPath, currentConfig);

                ({ urlPattern, rootPattern } = await this.currentEnvInteractive(variant, newEnvironment, urlPattern, rootPattern, product, configPath));
            }
        }

        product.environments.push(newEnvironment);
        this.saveProject(project);

        return Promise.resolve();
    }

    getEnvironmentToGenerate(product: Product): Promise<string> {
        const environments = product.environments;
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'environment',
                'type': 'input',
                'message': 'What should the name of the environment be?',
                'validate': (input) => {
                    if (environments.some(environment => environment.toLowerCase() === input.toLowerCase().trim())) {
                        return 'the environment already exists';
                    }

                    if (input?.trim()?.length === 0 ?? false) {
                        return 'the environment name cannot be blank';
                    }

                    return true;
                }
            }]).then((answer) => resolve(answer.environment))
                .catch(e => reject(e));
        });
    }
}
