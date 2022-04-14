import { sync } from 'glob';
import { relative, resolve } from 'path';


export class GlobReader {
    /**
   * Gets all mocha test files that should be run
   * @param sources the configured test sources.
   * @returns the absoloute paths to any found test files.
   */
    public static getTestFiles(sources: string[], abs: boolean = true): string[] {
        const files: string[] = [];

        this.processAllGlobs(sources, files, abs ? this.resolveAbs : this.resolveRel);

        return files;
    }

    /**
     * Process all globs. Converts a glob pattern to a path for each file that matches the pattern
     * @param fileGlobs the file glob patterns found from the configured sources
     * @param files the files array to save the file paths to
     */
    private static processAllGlobs(fileGlobs: string[], files: string[], func: (itm: string) => string) {
        this.getGlobsByFunc(fileGlobs, files, func);
    }

    /**
     * Function for resolving an absoloute path to a file from a glob
     */
    private static resolveAbs = (itm: string) => resolve(itm);

    /**
      * Function for resolving a relative path to a file from a glob (from the current working directory)
      */
    private static resolveRel = (itm: string) => relative(process.cwd(), resolve(itm));

    private static getGlobsByFunc(fileGlobs: string[], files: string[], func: (itm: string) => string) {
        for (const pattern of fileGlobs) {
            sync(pattern).forEach(itm => files.push(func(itm)));
        }
    }
}
