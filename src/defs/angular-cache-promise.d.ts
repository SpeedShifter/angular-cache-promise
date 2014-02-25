/// <reference path="../inc.d.ts" />
declare module SpeedShifter.Services {
    interface IPromiseCacheObject {
        get<T>(key: string, timeout?: number): T;
        set<T>(key: string, promise: JQueryPromise<T>, context?: any): JQueryPromise<T>;
        set<T>(key: string, promise: ng.IPromise<T>, context?: any): ng.IPromise<T>;
        remove(key: string): any;
        removeAll(): any;
    }
    interface IPromiseCacheService {
        (cacheId: string, optionsMap?: IPromiseCacheOptions): IPromiseCacheObject;
    }
    interface IPromiseCacheOptions {
        capacity?: number;
        timeout?: number;
        defResolver?: (...values: any[]) => any;
        saveFail?: boolean;
    }
    interface ICachePromiseDefResolver {
        (...values: any[]): any;
    }
    interface ICachePromiseProvider {
        setOptions(options: IPromiseCacheOptions): IPromiseCacheOptions;
        setDefResolver(resolver: <T>(...values: any[]) => T): any;
        useAngularDefResolver(): any;
        useJQueryDefResolver(): any;
    }
    var CachePromiseProvider: {}[];
}
