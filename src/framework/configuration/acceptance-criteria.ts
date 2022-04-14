/*
 * acceptance-criteria.ts

 */
import { AcceptanceCriteriaItem } from './acceptance-criteria-item';

export class AcceptanceCriteria {
    public acceptanceCriteriaItems: AcceptanceCriteriaItem[] = [];

    /**
     * Gets an acceptance criteria item, the search is case insensitive
     * @param tagName the name of the criteria tag from the relevant feature test configuration file.
     * @returns the @typedef AcceptanceCriteriaItem object
     */
    public getItem(tagName: string): AcceptanceCriteriaItem {
        return this.getAcceptanceCriteria(tagName);
    }

    /**
     * Gets the value for an acceptance criteria item, the search is case insensitive.
     * @param tagName the name of the criteria tag from the relevant feature test configuration file.
     * @returns the string value of the @typedef AcceptanceCriteriaItem 
     */
    public get(tagName: string): string {
        return this.getAcceptanceCriteria(tagName).value;
    }

    /**
     * Gets the full acceptance criteria item based off the tag name provided.
     * @param tagName the name of the acceptance criteria item to search for
     * @returns the requested acceptance criteria item if it exists
     * @throws if no acceptance criteria item matches the expected tag name 
     */
    public getAcceptanceCriteria(tagName: string): AcceptanceCriteriaItem {
        for (const itm of this.acceptanceCriteriaItems) {
            if (itm.tag.toLowerCase() === tagName.toLowerCase()) {
                return itm;
            }
        }

        throw new Error(`No acceptance criteria item with the name of ${tagName}`);
    }
}