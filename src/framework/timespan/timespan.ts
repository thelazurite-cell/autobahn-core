export class Timespan {
    public hours: number = 0;
    public minutes: number = 0;
    public seconds: number = 0;
    public milliseconds: number = 0;

    constructor(hours: number, minutes: number, seconds: number, milliseconds: number) {
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
        this.milliseconds = milliseconds;
    }

    public static fromHours(hours: number): Timespan {
        return new Timespan(hours, 0, 0, 0);
    }

    public static fromMinutes(minutes: number): Timespan {
        return new Timespan(0, minutes, 0, 0);
    }

    public static fromSeconds(seconds: number): Timespan {
        return new Timespan(0, 0, seconds, 0);
    }

    public toMs(): number {
        return (this.hours * 60 * 60 * 1000) + (this.minutes * 60 * 1000) + (this.seconds * 1000) + this.milliseconds;
    }

    private dateTimeFormat(toConvert: number): string {
        return toConvert > 9 ? '' + toConvert.toString() : '0' + toConvert.toString();
    }

    public toString: () => string = () => `${this.dateTimeFormat(this.hours)}:${this.dateTimeFormat(this.minutes)}:${this.dateTimeFormat(this.seconds)}.${this.milliseconds}`;
}
