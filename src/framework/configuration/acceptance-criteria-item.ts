/*
 * acceptance-criteria-item.ts

 */
export class AcceptanceCriteriaItem {
    /**
     * The Tag of an acceptance criteria item. This is the name, and will be used when searching
     * for a specific acceptance criteria item.
     */
    tag: string = '';

    /**
     * The value of an acceptance criteria item. This can be any string.
     */
    value?: string = '';

    /**
     * The array of values that an acceptance criteria item contains.
     */
    values?: string[] = [];
}