/// <reference path="../inc.d.ts" />
declare module SpeedShifter.Services {
    interface IDepCheckerOptions {
        expires?: number;
        dependent?: string[];
    }
    interface IDepCheckerDepend {
        name: string;
        value: any;
        comparator?: (item1: any, item2: any) => boolean;
    }
    class DepStorage {
        private storage;
        private global;
        constructor(...globals: DepStorage[]);
        public setGlobals(...globals: DepStorage[]): void;
        public addGlobals(...globals: DepStorage[]): DepStorage[];
        public getGlobals(): DepStorage[];
        public getDepend(name: string): any;
        public isDependentFailed(vals: {
            [name: string]: any;
        }, deps: string[]): boolean;
        public composeDeps(dep: string[]): {
            [prop: string]: any;
        };
        public setDependence(dep: Services.ILocalStorageDepend): void;
        public removeDependence(name: string): void;
        public setDependenceVal(name: string, val: any): void;
        static compare(dep: IDepCheckerDepend, val: any): boolean;
    }
    class ExpirationChecker {
        static isItemOutdated(time: number, expires: number, now?: number): boolean;
        static now(): number;
    }
    interface IDepCheckerItemWrapper {
        time?: number;
        depends?: {
            [name: string]: any;
        };
    }
    class DepChecker {
        public options: IDepCheckerOptions;
        public depStorage: DepStorage;
        static isItemInvalid(item: IDepCheckerItemWrapper, options: IDepCheckerOptions, depStorage: DepStorage, now?: number): boolean;
        constructor(options: IDepCheckerOptions, depStorage?: DepStorage);
        public isItemInvalid(item: IDepCheckerItemWrapper, now?: number): boolean;
        public setOptions(options: IDepCheckerOptions): void;
        public setDepStorage(depStorage: DepStorage): void;
    }
}
