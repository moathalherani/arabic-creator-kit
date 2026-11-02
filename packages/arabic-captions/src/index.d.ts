export interface Cue {
  start: number;
  end: number;
  text: string;
}

export interface KeywordCaption extends Cue {
  words: string[];
  /** index into `words` of the highlighted word, or -1 */
  keyword: number;
}

export interface KeywordOptions {
  /** words per caption, default 3 */
  maxWords?: number;
  /** minimum caption length in ms, default 250 */
  minDuration?: number;
  /** convert ٠-٩ to 0-9, default true */
  latinDigits?: boolean;
  /** remove fillers (true, false, or your own list), default true */
  fillers?: boolean | string[];
}

export interface AssStyle {
  font?: string;
  fontSize?: number;
  color?: string;
  highlight?: string;
  width?: number;
  height?: number;
  marginV?: number;
  bidi?: boolean;
}

export declare function parseTimestamp(ts: string): number;
export declare function formatTimestamp(ms: number, separator?: "," | "."): string;
export declare function parseSubtitles(input: string): Cue[];
export declare function toSrt(cues: Cue[]): string;
export declare function toVtt(cues: Cue[]): string;
export declare function toLatinDigits(text: string): string;
export declare function fixBidi(text: string): string;
export declare function removeFillers(text: string, fillers?: string[]): string;
export declare function pickKeyword(words: string[]): number;
export declare function keywordCaptions(cues: Cue[], options?: KeywordOptions): KeywordCaption[];
export declare function hexToAssColor(hex: string): string;
export declare function toAss(captions: (Cue & Partial<KeywordCaption>)[], style?: AssStyle): string;
