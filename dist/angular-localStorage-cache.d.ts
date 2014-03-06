
declare module SpeedShifter.Services {
    interface ILocalStorageConfig {
        valueName: string;
        expires?: number;
        limit?: number;
        json?: boolean;
        user_dependent?: boolean;
        multiple?: boolean;
    }
    interface ILocalStorageProvider {
        setAppName(name: string): any;
        addStoreConfig(config: ILocalStorageConfig): any;
    }
    interface ILocalStorageService {
        get(valName: string, propertyName?: string): any;
        set(valName: string, propertyName: string, val: any, updated?: number): any;
        remove(valName: string, propertyName?: string, limit?: number): any;
        setUserId(id: any): any;
    }
    var LocalStorageProvider: {}[];
}
