export interface ILocaleRules {
    pluralFn: (val: number, ordinal: boolean) => string;
    td: string;
    dd: string;
}
export declare function setRules(locale: string, params: any[]): void;
export declare function getLanguageFromLocale(locale: string): string;
export declare function getRules(locale: string): ILocaleRules;
