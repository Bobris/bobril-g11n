import { ILocaleRules } from "./localeDataStorage";
export declare function escapeRegExp(str: string): string;
export declare function buildFormatter(rules: ILocaleRules, format: string): (val: number) => string;
export declare function buildUnformat(rules: ILocaleRules): (val: string) => number;
