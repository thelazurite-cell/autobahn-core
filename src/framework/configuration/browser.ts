/*
 * browser.ts

 */
export class Browser {
    /**
     * The name of the browser (i.e. firefox, edge, chrome, etc.)
     */
    public name: string = '';

    /**
     * The extra command parameters to use if the browser is not running in headless mode.
     */
    public command: string = '';

    /**
     * The extra command parameters to use if the browser is running in headless mode.
     */
    public headlessCommand: string = '';
}
