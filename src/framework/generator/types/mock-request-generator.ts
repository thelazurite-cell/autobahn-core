import inquirer from 'inquirer';
import { injectable } from 'inversify';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { Configuration } from '../../configuration/configuration';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import { Product } from '../model/product';
import { Project } from '../model/project';

type MockRequestInfo = {
    mockRequestName: string,
    mockRequestUsesAppUrl: boolean,
    requestTo: string,
    responseBody: string,
    responseStatus: number;
}

@injectable()
export class MockRequestGenerator extends GeneratorWithProduct {
    generateType: string = 'Mock Request';
    product: Product;

    async generate(project: Project): Promise<void> {
        this.product = await super.getProduct(project);

        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'input',
                name: 'mockRequestName',
                message: 'What should the identifiable name of the request be?',
                validate: (input) => {
                    if (this.product.mockApiRequests && this.product.mockApiRequests.length > 0) {
                        const exists = this.product.mockApiRequests.some(itm => itm.name.toLowerCase() === input.toLowerCase());
                        if (exists) {
                            return 'There is already a mock API request with this name!';
                        }
                    }

                    return true;
                }
            }, {
                type: 'confirm',
                name: 'mockRequestUsesAppUrl',
                message: `Does the mock API request use the application URL (${Configuration.application.testHost})?`
            }, {
                type: 'input',
                name: 'requestTo',
                message: 'What endpoint does the mock API request target?',
                validate: (input) => {
                    if ((input || '').length === 0) {
                        return 'You must provide an endpoint!';
                    }

                    return true;
                }
            }, {
                type: 'editor',
                name: 'responseBody',
                message: 'What should the request body be?'
            }, {
                type: 'input',
                name: 'responseStatus',
                message: 'What should the response status be?',
                validate: input => {
                    if ((input || '').length === 0) {
                        return 'You must provide a status code!';
                    }

                    if (typeof +input !== 'number' || isNaN(+input)) {
                        // Pass the return value in the done callback
                        return 'You need to provide a number for status code!';
                    }

                    return true;
                }
            }]).then(answers => {
                answers.responseStatus = +answers.responseStatus;
                const ans: MockRequestInfo = answers;

                if (!this.product.mockApiRequests) {
                    this.product.mockApiRequests = [];
                }

                const hostUrl: string = ans.mockRequestUsesAppUrl ? `${Configuration.application.ssl ? 'https://' : 'http://'}${Configuration.application.testHost}` : '';

                this.product.mockApiRequests.push({
                    'hostUrl': hostUrl,
                    'name': ans.mockRequestName,
                    'requestTo': ans.requestTo,
                    'responseStatusCode': ans.responseStatus,
                    'responseBody': ans.responseBody.replace(/\r/g, '').replace(/\n/g, ''),
                    'usesApplicationUrl': ans.mockRequestUsesAppUrl
                });

                console.log(ans);
                fs.writeFileSync(path.resolve(path.join(process.cwd(), 'config', 'project.json')), prettier.format(JSON.stringify(project), { parser: 'json' }));

                return resolve();
            }).catch(e => reject(e));
        });
    }
}