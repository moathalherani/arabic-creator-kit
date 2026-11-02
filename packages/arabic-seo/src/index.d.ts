export type JsonLd = Record<string, unknown>;

export declare function toLatinDigits(text: string): string;
export declare function toArabicDigits(text: string | number): string;
export declare function stripTashkeel(text: string): string;
export declare function normalizeArabic(text: string): string;
export declare function transliterate(text: string): string;
export declare function slugify(text: string, options?: { transliterate?: boolean; maxLength?: number; separator?: string }): string;
export declare function detectDirection(text: string, fallback?: "rtl" | "ltr"): "rtl" | "ltr";
export declare function arabicRatio(text: string): number;
export declare function metaDescription(text: string, max?: number): string;
export declare function readingTime(text: string, options?: { wpm?: number }): number;

export interface HreflangLink {
  rel: "alternate";
  hreflang: string;
  href: string;
}
export declare function hreflangLinks(alternates: Record<string, string>, options?: { xDefault?: string }): HreflangLink[];
export declare function hreflangHtml(alternates: Record<string, string>, options?: { xDefault?: string }): string;

export declare function personJsonLd(input: {
  name: string;
  alternateName?: string | string[];
  url?: string;
  image?: string;
  jobTitle?: string | string[];
  email?: string;
  sameAs?: string[];
  worksFor?: string | JsonLd;
}): JsonLd;
export declare function articleJsonLd(input: {
  headline: string;
  description?: string;
  url?: string;
  image?: string | string[];
  inLanguage?: string;
  datePublished?: string | Date;
  dateModified?: string | Date;
  author?: string | JsonLd;
  type?: "Article" | "BlogPosting" | "NewsArticle";
}): JsonLd;
export declare function faqJsonLd(items: { question: string; answer: string }[]): JsonLd;
export declare function breadcrumbJsonLd(items: { name: string; url?: string }[]): JsonLd;
export declare function videoJsonLd(input: {
  name: string;
  description?: string;
  thumbnailUrl: string | string[];
  uploadDate: string | Date;
  contentUrl?: string;
  embedUrl?: string;
  duration?: number | string;
  inLanguage?: string;
}): JsonLd;
export declare function secondsToIsoDuration(seconds: number): string;
export declare function jsonLdString(data: unknown): string;
export declare function jsonLdScript(data: unknown): string;
