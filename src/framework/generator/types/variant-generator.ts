/* eslint-disable max-classes-per-file */
import { Project } from '../model/project';
import { injectable } from 'inversify';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { Product } from '../model/product';
import { Configuration } from '../../configuration/configuration';
import { MassConfigGenerator } from './mass-config-generator';

@injectable()
export class VariantGenerator extends MassConfigGenerator {
    generateType: string = 'Variant';

    async generate(project: Project): Promise<void> {
        const product = await this.getProduct(project);
        const newVariant = await this.getVariantToGenerate(product);
        const type = product.environments;

        const inputEnvInfo = await this.getShouldInputEnvDetails();

        if (!inputEnvInfo) {
            for (const environment of type) {
                const currentConfig = `appConfig.${product.productName}.${newVariant}.${environment}.json`;
                this.currentEnvAuto(product, currentConfig);
            }
        } else {
            let urlPattern: string;
            let rootPattern: string;
            for (const environment of type) {
                const currentConfig = `appConfig.${product.productName}.${newVariant}.${environment}.json`;
                const configPath = path.join(product.baseConfigPath, currentConfig);

                ({ urlPattern, rootPattern } = await this.currentEnvInteractive(newVariant, environment, urlPattern, rootPattern, product, configPath));
            }
        }

        const featureConfig = `featureTestConfig.${product.productName}.${newVariant}.json`;
        const featureConfigPath = path.join(product.baseConfigPath, featureConfig);
        product.variants.push(newVariant);
        product.featureConfigFiles.push(featureConfigPath);
        fs.writeFileSync(path.resolve(featureConfigPath), prettier.format(JSON.stringify(Configuration.tests), { parser: 'json' }));
        this.saveProject(project);

        return Promise.resolve();
    }

    getVariantToGenerate(product: Product): Promise<string> {
        const variants = product.variants;
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'variant',
                'type': 'input',
                'message': 'What should the name of the variant be?',
                'validate': (input) => {
                    if (variants.some(variant => variant.toLowerCase() === input.toLowerCase().trim())) {
                        return 'the variant already exists';
                    }

                    if (input?.trim()?.length === 0 ?? false) {
                        return 'the variant name cannot be blank';
                    }

                    return true;
                }
            }]).then((answer) => resolve(answer.variant))
                .catch(e => reject(e));
        });
    }
}
