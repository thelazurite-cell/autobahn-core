import boxen from 'boxen';
import inquirer from 'inquirer';
import { Configuration } from '../../configuration/configuration';
import { Project } from '../model/project';
import { TestArea } from '../model/test-area';
import { Product } from '../model/product';
import { injectable } from 'inversify';
import { IGenerator } from './generator.interface';
import { join } from 'path';

@injectable()
export abstract class GeneratorWithProduct implements IGenerator {
    generateType: string = '';
    tslintPath: string = join(__dirname, '..', '..', '..', '..', 'tslint.json');


    abstract generate(project: Project): Promise<void>;

    getProduct(project: Project): Promise<Product> {

        const products = project.products.map(itm => itm.productName);
        return new Promise((resolve, reject) => {
            inquirer.prompt([{ name: 'product', message: 'Which product do you want to generate for?', type: 'list', choices: products, pageSize: 15 }]).then(answer => {
                const product: Product = project.products.filter(itm => itm.productName == answer.product)[0];
                Configuration.product = product.fallbackVariant;
                Configuration.environment = product.environments[0];
                console.log(boxen(`Generating ${this.generateType}\nFor Product: ${Configuration.product} - ${Configuration.environment}`, { borderColor: 'green', borderStyle: 'single', padding: 2 }));
                Configuration.reinitialize();
                resolve(product);
            }).catch(e => reject(e));
        });
    }
    getTestArea(product: Product): Promise<TestArea> {
        const testAreas = product.testAreas.map(itm => itm.areaName);
        return new Promise((resolve, reject) => {
            inquirer.prompt([{ name: 'areaName', message: 'Which test area do you want to generate for?', type: 'list', choices: testAreas, pageSize: 15 }]).then(answer => {
                const testArea: TestArea = product.testAreas.filter(itm => itm.areaName == answer.areaName)[0];
                resolve(testArea);
            }).catch(e => reject(e));
        });
    }
}
