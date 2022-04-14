import { Options } from '../../options';


export class ByTypeOptions {
    query: string;
    elementType: string;
    selectorOptions: string[] = [];

    constructor(elementType: string, query: string, selectorOptions: Options[]) {
        this.query = query;
        this.elementType = elementType;
        this.selectorOptions = selectorOptions.map(itm => itm.toString());
    }
}
