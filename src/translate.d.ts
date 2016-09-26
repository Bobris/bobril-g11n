export interface IG11NConfig {
    defaultLocale?: string;
    pathToTranslation?: (locale: string) => string | undefined;
}
export declare function t(message: string | number, params?: Object, _translationHelp?: string): string;
export declare function f(message: string, params: Object): string;
export declare function initGlobalization(config?: IG11NConfig): Promise<void>;
export declare function setLocale(locale: string): Promise<any>;
export declare function getLocale(): string;
export declare function getMoment(init?: any, init2?: any, init3?: any): moment.Moment;
export declare function unformatNumber(str: string): number;
export declare function registerTranslations(locale: string, localeDefs: any[], msgs: string[]): void;
