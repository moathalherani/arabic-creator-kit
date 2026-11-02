export type DateInput = Date | string | number;
export type MonthStyle = "standard" | "levant" | "maghreb";

export declare const MONTHS: Readonly<Record<MonthStyle, readonly string[]>>;
export declare const HIJRI_MONTHS: readonly string[];
export declare const WEEKDAYS: readonly string[];

export declare function formatDate(
  date: DateInput,
  options?: { months?: MonthStyle | "both"; weekday?: boolean; arabicDigits?: boolean; timeZone?: string },
): string;

export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
}
export declare function toHijri(date: DateInput, options?: { timeZone?: string }): HijriDate;
export declare function formatHijri(date: DateInput, options?: { arabicDigits?: boolean; suffix?: boolean; timeZone?: string }): string;
export declare function fromHijri(year: number, month: number, day: number): Date;

export interface Occasion {
  key: "hijri-new-year" | "mawlid" | "isra-miraj" | "ramadan" | "eid-al-fitr" | "arafah" | "eid-al-adha";
  ar: string;
  en: string;
  date: Date;
  hijri: string;
}
export declare function islamicOccasions(gregorianYear: number): Occasion[];

export declare function timeAgo(date: DateInput, options?: { now?: DateInput; style?: "msa" | "levant"; arabicDigits?: boolean }): string;
