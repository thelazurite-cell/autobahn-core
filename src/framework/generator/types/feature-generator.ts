import { Project } from '../model/project';
import { injectable } from 'inversify';
import { GeneratorWithProduct } from '../interfaces/generator-with-product.abstract';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { TestArea } from '../model/test-area';
import { GlobReader } from '../../gherkin/support/glob-reader';
import { kebabize } from '../../helpers/string-helpers';
import { SourcesType } from '../../configuration/sources-type.enum';
import { State } from '../../logging/state';

type FeatureDescriptionMeta = {
    featureTitle: string,
    roleOrPerson: string,
    actionType: string,
    actionPerformed: string,
    valueAchieved: string
}

@injectable()
export class FeatureGenerator extends GeneratorWithProduct {
    generateType: string = 'Feature File';

    async generate(project: Project): Promise<void> {
        const product = await this.getProduct(project);
        const testArea = await this.getTestArea(product);
        const featureFileName = await this.getFeatureFileName(testArea);
        const description = await this.getFeatureDescription();

        const templatePath = path.resolve(path.join('src', 'framework', 'generator', 'templates', 'template.feature'));
        let featureText = fs.readFileSync(templatePath, { encoding: 'utf8' });
        featureText = featureText.replace('{{featureTitle}}', description.featureTitle)
            .replace('{{roleOrPerson}}', description.roleOrPerson)
            .replace('{{actionType}}', description.actionType)
            .replace('{{actionPerformed}}', description.actionPerformed)
            .replace('{{valueAchieved}}', description.valueAchieved);

        const specFolder = testArea.sourceType == SourcesType.browser ? product.browserSpecFolder : product.apiSpecFolder;
        const filePath = path.resolve(path.join(specFolder, testArea.areaName));
        State.createMissingDirectories(filePath);
        fs.writeFileSync(path.join(filePath, featureFileName), featureText, { encoding: 'utf8' });
    }

    async getFeatureDescription(): Promise<FeatureDescriptionMeta> {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'featureTitle',
                'type': 'input',
                'message': 'Feature:'
            },
            {
                'name': 'roleOrPerson',
                'type': 'input',
                'message': 'As a'
            }, {
                'name': 'actionType',
                'type': 'list',
                'message': '.',
                'choices': ['I can', 'I want to']
            }, {
                'name': 'actionPerformed',
                'type': 'input',
                'message': '.'
            }, {
                'name': 'valueAchieved',
                'type': 'input',
                'message': 'So that'
            }]).then(answer => resolve(answer))
                .catch(e => reject(e));
        });
    }

    async getFeatureFileName(testArea: TestArea): Promise<string> {
        const pageObjectModels = [...GlobReader.getTestFiles(testArea.specs).map(itm => {
            const forwardSlash = itm.includes('/');
            const split = itm.split(forwardSlash ? '/' : '\\');
            return split[split.length - 1];
        })];
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                'name': 'featureFileName',
                'type': 'input',
                'message': 'Provide a name for the feature file',
                'validate': (input) => {
                    input = input || '';
                    const parsed = input.toString().toLowerCase().trim();
                    if (pageObjectModels.includes(`${kebabize(parsed)}.spec.feature`)) {
                        return 'There is already a feature file with this name';
                    }

                    if (parsed.length === 0) {
                        return 'You must provide a feature file name';
                    }

                    return true;
                }
            }]).then((answer) => resolve(`${kebabize(answer.featureFileName.trim())}.spec.feature`))
                .catch((e) => reject(e));
        });
    }

}
