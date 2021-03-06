declare module SpeedShifter.Services {
    interface ICachePromiseObject {
        get<T>(key: string, timeout?: number): T;
        set(key: string, promise: JQueryPromise<any>): JQueryPromise<any>;
        set(key: string, promise: ng.IPromise<any>): ng.IPromise<any>;
        remove(key: string): any;
        removeAll(): any;
        setOptions(options?: ICachePromiseOptions): any;
    }
    interface ICachePromiseService {
        (cacheId: string, options?: ICachePromiseOptions): ICachePromiseObject;
    }
    interface ICachePromiseOptions {
        capacity?: number;
        timeout?: number;
        dontSaveResult?: boolean;
        defResolver?: ICachePromiseDefResolver<any>;
        JQPromise?: boolean;
        saveFail?: boolean;
    }
    interface ICachePromiseDefResolver<T> {
        (values: any[], failed?: boolean): T;
    }
    interface ICachePromiseProvider {
        setOptions(options: ICachePromiseOptions): ICachePromiseOptions;
    }
    var CachePromiseProvider: () => void;
}
