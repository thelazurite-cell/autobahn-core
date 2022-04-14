
export class CssOptions {
    public query: string;
    public multiple: boolean;

    constructor(query: string, multiple: boolean) {
        this.query = query;
        this.multiple = multiple;
    }

    toString(): string {
        return `{ '${this.query}' targetting multiple: ${this.multiple.toString()}`;
    }
}
