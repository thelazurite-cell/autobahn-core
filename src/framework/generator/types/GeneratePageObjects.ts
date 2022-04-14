/* eslint-disable max-classes-per-file */

export class PageObjectMetadata {
    public elementType: string;
    public id?: string;
    public cssSelector: string;
    public name?: string;
    public textContent?: string;
    public placeholder?: string;
    public type?: string;
    public classes?: string;
    public suggestedPropName?: string;
    public hasGenericName: boolean = false;
    public shouldGenerate: boolean = false;
    public isIframe: boolean = false;
    public iframeSelector: string;
}

export class GeneratePageObjects {
    public static genericNameCounter: number = 0;
    public static objectsNeedGenerating: PageObjectMetadata[] = [];
    public static typesToFind: string[] = [];
    static iframeOnly: boolean = false;

    public static clear() {
        this.genericNameCounter = 0;
        this.objectsNeedGenerating = [];
        this.typesToFind = [];
    }
}
