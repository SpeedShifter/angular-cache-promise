/// <reference path="./inc.d.ts" />

module App.Services {
	export interface IPromiseCacheObject {
		get<T>(key: string, timeout?: number): JQueryPromise<T>;
		set<T>(key: string, promise: JQueryPromise<T>): JQueryPromise<T>;

		remove(key: string);
		removeAll();
	}
	export interface IPromiseCacheService {
		(cacheId: string, optionsMap?: IPromiseCacheOptions): IPromiseCacheObject;
	}
	export interface IPromiseCacheOptions {
		capacity?: number; // for angular $cacheFactory
		timeout?: number;
	}
	interface IPromiseCachedObj {
		time?: number;
		promise?: JQueryPromise<any>; // TODO: make it compatible with ng.IPromise
		data?: any; // cached data
	}
	export var PromiseCacheFactory = ['$cacheFactory', function($cacheFactory: ng.ICacheFactoryService) {
		return <IPromiseCacheService>function (cacheId: string, options: IPromiseCacheOptions) {
			var me = <IPromiseCacheObject>{};

			var cache = $cacheFactory(cacheId, options);

			me.get = function(key: string, timeout: number = options.timeout) {
				var cached = cache.get(key);
				if (cached && cached.promise) {
					return cached.promise;
				}
				if (cached && (!options.timeout || ( (new Date()).getTime() - cached.time < timeout))) {
					var def = $.Deferred();
					def.resolve.apply(this, cached.data);
					return def.promise();
				}
				return null;
			};

			me.set = function <T>(key: string, promise: JQueryPromise<T>) {
				var cached_obj = <IPromiseCachedObj>{
					promise: promise
				};

				var fnc = ()=>{
					cached_obj.data = Array.prototype.slice.call(arguments);
					cached_obj.time = (new Date()).getTime();
					delete cached_obj.promise;
				};
				promise.done(fnc).fail(fnc);

				cache.put(key, cached_obj);
				return promise;
			};

			me.remove = function (key: string) {
				cache.remove(key);
			};
			me.removeAll = function () {
				cache.removeAll();
			};

			return me;
		};
	}];
}
