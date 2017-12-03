import * as moment from "moment";
export interface IG11NConfig {
    defaultLocale?: string;
    pathToTranslation?: (locale: string) => string | undefined;
}
export declare let registeredTranslations: {
    [name: string]: string[];
};
export declare function t(message: string | number, params?: Object, _translationHelp?: string): string;
export declare function f(message: string, params: Object): string;
export declare function initGlobalization(config?: IG11NConfig): Promise<void>;
export declare function setLocale(locale: string): Promise<void>;
export declare function getLocale(): string;
export declare const getMoment: typeof moment;
export declare function unformatNumber(str: string): number;
export declare function registerTranslations(locale: string, localeDefs: any[], msgs: string[]): void;
export declare function spyTranslation(spyFn?: ((text: string) => string) | null): ((text: string) => string) | undefined;
