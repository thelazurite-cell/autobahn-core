import { Project } from '../model/project';


export interface IGenerator {
    generateType: string;
    generate(project: Project): Promise<void>;
}
