/// <reference path="../inc.d.ts" />
declare module SpeedShifter.Services {
    interface ICachePromiseObject {
        get<T>(key: string, timeout?: number): T;
        set(key: string, promise: JQueryPromise<any>, context?: any): JQueryPromise<any>;
        set(key: string, promise: ng.IPromise<any>, context?: any): ng.IPromise<any>;
        remove(key: string): any;
        removeAll(): any;
    }
    interface ICachePromiseService {
        (cacheId: string, optionsMap?: ICachePromiseOptions): ICachePromiseObject;
    }
    interface ICachePromiseOptions {
        capacity?: number;
        timeout?: number;
        defResolver?: ICachePromiseDefResolver<any>;
        JQPromise?: boolean;
        saveFail?: boolean;
    }
    interface ICachePromiseDefResolver<T> {
        (...values: any[]): T;
    }
    interface ICachePromiseProvider {
        setOptions(options: ICachePromiseOptions): ICachePromiseOptions;
    }
    var CachePromiseProvider: () => void;
}
