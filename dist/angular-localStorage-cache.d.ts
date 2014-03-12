
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
        comparator: (item1: any, item2: any) => boolean;
    }
    interface ILocalStorageProvider {
        setAppName(name: string): any;
        setDefOptions(options: ILocalStorageOptions): any;
    }
    interface ILocalStorageService {
        (cacheId: string, options?: ILocalStorageOptions): ILocalStorageObject;
    }
    interface ILocalStorageObject {
        get(valName: string): any;
        set(valName: string, val: any, updated?: number): any;
        remove(valName: string, limit?: number): any;
        clear(): any;
        clearStorage(): any;
        setDependence(dep: ILocalStorageDepend, global?: boolean): any;
        setDependenceVal(name: string, val: any, global?: boolean): any;
    }
    interface ILocalStorageItemWrapper {
        time?: number;
        data?: any;
        depends?: {
            [name: string]: any;
        };
    }
    class LocalStorageHelpers {
        static compare(dep: ILocalStorageDepend, val: any): boolean;
        static getDepend(name: string, depStorages: {
            [nm: string]: ILocalStorageDepend;
        }[]): ILocalStorageDepend;
        static isDependentFailed(vals: {
            [name: string]: any;
        }, deps: string[], depStorages: {
            [name: string]: ILocalStorageDepend;
        }[]): boolean;
        static isItemOutdated(item: ILocalStorageItemWrapper, options: ILocalStorageOptions, now?: number): boolean;
        static isItemInvalid(item: ILocalStorageItemWrapper, options: ILocalStorageOptions, depStorages: {
            [name: string]: ILocalStorageDepend;
        }[], now?: number): boolean;
        static composeDeps(dep: string[], depStorages: {
            [name: string]: ILocalStorageDepend;
        }[]): {};
    }
    var LocalStorageProvider: () => void;
}
