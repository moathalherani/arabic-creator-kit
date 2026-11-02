export type HookCategory = "shock" | "curiosity" | "promise" | "challenge" | "story";
export type DialectCode = "jo" | "eg" | "gulf" | "sy" | "ma" | "msa" | (string & {});

export interface Hook {
  readonly id: string;
  readonly category: HookCategory;
  readonly dialect: DialectCode;
  readonly ar: string;
  /** English translation. May be an empty string for community hooks added without one. */
  readonly en: string;
}

export interface HookTemplate {
  readonly id: string;
  readonly category: HookCategory;
  readonly ar: string;
  readonly en: string;
}

export type CtaIntent = "save" | "comment" | "share" | "follow" | "link" | "dm" | "try";

export interface Cta {
  readonly id: string;
  readonly intent: CtaIntent;
  readonly ar: string;
  readonly en: string;
}

export declare const CTA_INTENTS: readonly CtaIntent[];
export declare const ctas: readonly Cta[];
export declare function getCtas(options?: { intent?: CtaIntent }): Cta[];

export interface Tip {
  ar: string;
  en: string;
}

export interface HookScore {
  score: number;
  words: number;
  tips: Tip[];
}

export declare const CATEGORIES: readonly HookCategory[];
export declare const CATEGORY_LABELS: Readonly<Record<HookCategory, { ar: string; en: string }>>;
export declare const DIALECTS: Readonly<Record<string, string>>;
export declare const VIDEO_WEIGHTS: readonly { key: string; ar: string; en: string; weight: number }[];
export declare const hooks: readonly Hook[];
export declare const templates: readonly HookTemplate[];

export declare function getHooks(options?: { category?: HookCategory; dialect?: DialectCode; search?: string }): Hook[];
export declare function getHookById(id: string): Hook | undefined;
export declare function randomHook(options?: { category?: HookCategory; dialect?: DialectCode; random?: () => number }): Hook | undefined;
export declare function fillTemplate(
  template: string | { ar: string; en: string },
  values: Record<string, string | number>,
  lang?: "ar" | "en",
): string;
export declare function scoreHook(text: string): HookScore;
export declare function normalize(text: string): string;

declare const _default: {
  hooks: typeof hooks;
  ctas: typeof ctas;
  CTA_INTENTS: typeof CTA_INTENTS;
  getCtas: typeof getCtas;
  CATEGORIES: typeof CATEGORIES;
  CATEGORY_LABELS: typeof CATEGORY_LABELS;
  DIALECTS: typeof DIALECTS;
  VIDEO_WEIGHTS: typeof VIDEO_WEIGHTS;
  templates: typeof templates;
  getHooks: typeof getHooks;
  getHookById: typeof getHookById;
  randomHook: typeof randomHook;
  fillTemplate: typeof fillTemplate;
  scoreHook: typeof scoreHook;
  normalize: typeof normalize;
};
export default _default;
