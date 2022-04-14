/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * key-value-map.ts

 */
export class KeyValueMap {
    key = '';
    value: any = {};

    constructor(key: string, value: string | any[]) {
        this.key = key;
        this.value = value;
    }
}
