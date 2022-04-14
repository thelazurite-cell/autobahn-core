import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { Configuration } from '../configuration/configuration';

export class DataLoader {
    /**
     * Loads a test json file into the framework
     * @param basePath is the path before the 'test-data' folder. it will determine whether to load the basic file or the relevant variant file from within the 'test-data' folder
     * @param fileName the name of the file you want to load in
     * @param objectDestination where the test data should be loaded into
     */
    public static loadJson(basePath: string, fileName: string, objectDestination: any): void {
        const baseTestDataPath = resolve(join(basePath, 'test-data'));
        const variantPath = join(
            baseTestDataPath,
            Configuration.product.toLowerCase(),
            fileName
        );
        const jsonDataPath = existsSync(variantPath)
            ? variantPath
            : join(baseTestDataPath, fileName);
        const jsonData = readFileSync(jsonDataPath, { encoding: 'utf8' });
        const object = JSON.parse(jsonData);
        Object.assign(objectDestination, object);
    }
}