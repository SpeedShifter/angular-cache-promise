
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
    var LocalStorageProvider: () => void;
}
