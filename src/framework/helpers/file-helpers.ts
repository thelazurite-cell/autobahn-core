import { readdirSync, lstatSync } from 'fs';
import { join } from 'path';

export function orderByNewest(directory: string, fileType: string = ''): { file: string; mtime: Date; }[] {
    return readdirSync(directory)
        .filter(file => lstatSync(join(directory, file)).isFile() && file.endsWith(fileType))
        .map(file => ({ file: join(directory, file), mtime: lstatSync(join(directory, file)).mtime }))
        .sort((current, next) => next.mtime.getTime() - current.mtime.getTime());
}