import { Project } from '../model/project';
import { injectable } from 'inversify';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import prettier from 'prettier';
import { kebabize } from '../../helpers/string-helpers';
import { TestArea } from '../model/test-area';
import { EnumHelper } from '../../helpers/enum-helper';
import { SourcesType } from '../../configuration/sources-type.enum';
import { State } from '../../logging/state';

@injectable()
export class TestAreaGenerator extends GeneratorWithProduct {
    generateType: string = 'Test Area';

    async generate(project: Project): Promise<void> {
        const product = await this.getProduct(project);
        const testAreaNames = product.testAreas.map(item => item.areaName);
        const newTestAreaName = await this.getNewTestArea(testAreaNames);
        const testAreaType = await this.getTestAreaType();
        const newTestArea = new TestArea();
        newTestArea.areaName = newTestAreaName;
        newTestArea.sourceType = EnumHelper.TryParse(SourcesType, testAreaType);

        if (newTestArea.sourceType === SourcesType.browser) {
            const pageObjectModelsDir = path.join(path.resolve(product.basePageObjectFolder), newTestAreaName);
            State.createMissingDirectories(pageObjectModelsDir);
            newTestArea.pageObjectModels.push(path.join(path.relative(process.cwd(), pageObjectModelsDir), '**', '*.ts'));
        }

        const stepsDir = path.join(
            path.resolve(
                newTestArea.sourceType === SourcesType.browser
                    ? product.browserStepFolder
                    : product.apiStepFolder
            ),
            newTestAreaName
        );

        State.createMissingDirectories(stepsDir);

        newTestArea.steps.push(path.join(path.relative(process.cwd(), stepsDir), '**', '*.steps.ts'));

        const specsDir = path.join(
            path.resolve(
                newTestArea.sourceType === SourcesType.browser
                    ? product.browserSpecFolder
                    : product.apiSpecFolder
            ),
            newTestAreaName
        );

        State.createMissingDirectories(specsDir);

        newTestArea.specs.push(path.join(path.relative(process.cwd(), specsDir), '**', '*.spec.feature'));
        product.testAreas.push(newTestArea);

        fs.writeFileSync(path.join(process.cwd(), 'config', 'project.json'), prettier.format(JSON.stringify(project), { parser: 'json' }));

        console.log(newTestArea);
        return Promise.resolve();
    }

    private getTestAreaType(): Promise<string> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'sourceType',
                'type': 'list',
                'message': 'What source type is the test area for?',
                'choices': ['api', 'browser']
            }]).then(answer => resolve(answer.sourceType))
                .catch(e => reject(e));
        });
    }

    private getNewTestArea(testAreaNames: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'testArea',
                'type': 'input',
                'message': 'What should the name of the test area be?',
                'validate': (input) => {
                    if (testAreaNames.some(product => product.toLowerCase() === kebabize(input.toLowerCase()))) {
                        return 'the test area already exists';
                    }

                    if (input?.trim()?.length === 0 ?? false) {
                        return 'the test area cannot be blank';
                    }

                    return true;
                }
            }]).then(answer => {
                resolve(kebabize(answer.testArea));
            }).catch(e => reject(e));
        });
    }
}
