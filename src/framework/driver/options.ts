export enum Options {
    /***
     * Don't wait for ajax calls.
     */
    NoWait = 'NoWait',
    /***
     * Include invisible elements
     */
    AllowInvisible = 'AllowInvisible',
    /***
     * There should only be a single result from the locator
     */
    Single = 'Single',
    /***
     * Gets the first element from a locator search
     */
    First = 'First',
    /***
     * Gets the last element from a locator search
     */
    Last = 'Last',
    /***
     * Search must be an exact match.
     */
    Exact = 'Exact',
    /***
     * Scroll element into view
     */
    ScrollIntoView = 'ScrollIntoView'
}
