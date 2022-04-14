import { prompt, registerPrompt, Separator } from 'inquirer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Project } from './model/project';
import { GenerateableTypes } from './model/generateable-types.enum';
import { FrameworkContainer } from '../framework.config';
import { IGenerator } from './interfaces/generator.interface';
import { FrameworkTags } from '../framework-tags.config';
import { FrameworkFunctionality } from '../framework-functionality.config';

registerPrompt('table', require('inquirer-table-prompt'));
registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

export class GeneratorCli {
    private project: Project = new Project();

    public async run(): Promise<void> {
        const projectFile = join(process.cwd(), 'config', 'project.json');
        const projectContents = JSON.parse(readFileSync(projectFile, { encoding: 'utf8' }));
        Object.assign(this.project, projectContents);
        const generateOptions = Object.keys(GenerateableTypes);
        let generateType = null;
        while (generateType != 'quit') {
            generateType = await this.getGenerationType(generateOptions);
            if (generateType != 'quit') {
                const generator = FrameworkContainer.getTagged<IGenerator>(FrameworkFunctionality.Generator, FrameworkTags.generatorType, generateType);
                await generator.generate(this.project);
            }
        }
    }

    private getGenerationType(generateOptions: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            prompt([{
                name: 'generateType',
                message: 'What do you want to generate?',
                type: 'list',
                choices: [...generateOptions, new Separator(), 'quit'],
                pageSize: 15
            }]).then(answer => {
                const generateType = answer.generateType;

                resolve(generateType);
            }).catch(e => reject(e));
        });
    }
}

