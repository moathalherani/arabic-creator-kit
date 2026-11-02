export type Gender = "m" | "f";
export type HundredSpelling = "مائة" | "مئة";

export interface NounForms {
  /** singular: درهم */
  one: string;
  /** dual: درهمان */
  two: string;
  /** plural used with 3–10: دراهم */
  plural: string;
  /** form used with 11–99: درهمًا */
  acc: string;
  gender?: Gender;
}

export interface Currency {
  name: string;
  digits: number;
  unit: NounForms;
  sub?: NounForms;
}

export type CurrencyCode = "AED" | "SAR" | "QAR" | "OMR" | "KWD" | "BHD" | "JOD" | "EGP" | "USD" | "EUR" | "LBP";

export declare const CURRENCIES: Readonly<Record<CurrencyCode, Currency>>;
export declare function toWords(value: number | bigint | string, options?: { gender?: Gender; hundred?: HundredSpelling }): string;
export declare function countNoun(value: number, noun: NounForms, options?: { hundred?: HundredSpelling }): string;
export declare function amountToWords(
  value: number | string,
  options?: { currency?: CurrencyCode | Lowercase<CurrencyCode>; only?: boolean; hundred?: HundredSpelling },
): string;
export declare function ordinal(n: number, gender?: Gender): string;
