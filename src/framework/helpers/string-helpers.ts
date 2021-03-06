import { join, relative, resolve } from 'path';

export function camelize(str: string, enforceUpper: boolean = true): string {
    let value = str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word) {
        return word.toUpperCase();
    }).replace(/(\s)+|-/g, '');

    value = `${(enforceUpper ? value.charAt(0).toUpperCase() : value.charAt(0).toLowerCase())}${value.slice(1)}`;

    return value;
}

export function kebabize(str: string): string {
    return camelize(str).split('').map((letter, idx) => {
        return letter.toUpperCase() === letter
            ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
            : letter;
    }).join('').replace(/_/g, '-');
}

export function getImportPath(thisLocation: string, importLocation: string, isPackage: boolean = true): string {
    const backwardsSlash = thisLocation.indexOf('\\') > -1;
    const splitLocation = thisLocation.split(backwardsSlash ? '\\' : '/');
    splitLocation.pop();

    const sourceFile = resolve(join(...splitLocation));
    const extensionRemoved = importLocation.replace('.ts', '');
    let importPath = isPackage ? extensionRemoved.replace(/\\/g, '/') : relative(
        sourceFile,
        resolve(extensionRemoved)
    ).replace(/\\/g, '/');

    if (!isPackage) {
        if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
            importPath = `./${importPath}`;
        }
    }

    return importPath;
}