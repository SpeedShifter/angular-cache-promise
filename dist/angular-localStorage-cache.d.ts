/// <reference path="../inc.d.ts" />
declare module SpeedShifter.Services {
    interface ILocalStorageOptions {
        expires?: number;
        dependent?: string[];
        critical?: boolean;
        cleanTimeout?: number;
    }
    interface ILocalStorageDepend {
        name: string;
        value: any;
        comparator?: (item1: any, item2: any) => boolean;
    }
    interface ILocalStorageProvider {
        setAppName(name: string): any;
        setDefOptions(options: ILocalStorageOptions): any;
    }
    interface ILocalStorageService {
        (cacheId: string, options?: ILocalStorageOptions): ILocalStorageObject;
    }
    interface ILocalStorageObject {
        getLocalStorageKey(valName: string): any;
        get(valName: string): any;
        set(valName: string, val: any, updated?: number): any;
        remove(valName: string): any;
        clear(): any;
        clearStorage(): any;
        setDependence(dep: ILocalStorageDepend, global?: boolean): any;
        removeDependence(name: string, global?: boolean): any;
        setDependenceVal(name: string, val: any, global?: boolean): any;
        setOptions(options: ILocalStorageOptions): any;
    }
    interface ILocalStorageItemWrapper extends Services.IDepCheckerItemWrapper {
        data?: any;
    }
    var LocalStorageProvider: () => void;
}
