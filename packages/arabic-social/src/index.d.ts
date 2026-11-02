export type PlatformKey = "instagram" | "tiktok" | "youtube" | "shorts" | "x" | "threads" | "linkedin" | "facebook" | "snapchat" | "pinterest";

export interface Platform {
  name: string;
  caption: number;
  title?: number;
  hashtags?: number;
  mentions?: number;
  preview?: number;
  bio?: number;
  headline?: number;
  weighted?: boolean;
}

export interface Problem {
  ar: string;
  en: string;
}

export interface PostCheck {
  platform: string;
  length: number;
  limit: number;
  remaining: number;
  ok: boolean;
  hashtags: string[];
  hashtagLimit?: number;
  mentions: string[];
  preview?: string;
  problems: Problem[];
}

export declare const PLATFORMS: Readonly<Record<PlatformKey, Platform>>;
export declare function hashtag(text: string, options?: { separator?: string; latinDigits?: boolean }): string;
export declare function hashtagKey(tag: string): string;
export declare function hashtags(phrases: string[], options?: { platform?: PlatformKey; max?: number }): string[];
export declare function extractHashtags(text: string): string[];
export declare function extractMentions(text: string): string[];
export declare function countCharacters(text: string): number;
export declare function xLength(text: string): number;
export declare function previewText(text: string, chars?: number): string;
export declare function checkPost(text: string, platform?: PlatformKey): PostCheck;
export declare function cleanCaption(text: string): string;
export declare function keepLineBreaks(text: string): string;
