/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * EnumHelper.ts

 */
export class EnumHelper {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static iterateEnum(enm: any): any[] {
        const items = [];
        for (const item in enm) {
            if (isNaN(Number(item))) {
                items.push(item.toLowerCase());
            }
        }

        return items;
    }

    public static TryParse<T>(enm: unknown, value: string): T {
        const members = this.iterateEnum(enm);
        if (members) {
            if (members.length) {
                const filter = members.filter(itm => itm === value);
                if (filter.length > 0) {
                    return enm[value as keyof typeof enm];
                }
            }
        }

        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static EnumToString(enm: any, value: any): string {
        for (const k in enm) {
            if (enm[k] === value) {
                return k;
            }
        }
    }
}
