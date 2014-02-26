/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	'use strict';
	export interface ICachePromiseObject {
		get<T>(key:string, timeout?:number): T;

		set<T>(key:string, promise:JQueryPromise<T>, context?:any): JQueryPromise<T>;
		set<T>(key:string, promise:ng.IPromise<T>, context?:any): ng.IPromise<T>;

		remove(key:string);
		removeAll();
	}
	export interface ICachePromiseService {
		(cacheId:string, optionsMap?:ICachePromiseOptions): ICachePromiseObject;
	}
	export interface ICachePromiseOptions {
		capacity?: number; // for angular $cacheFactory
		timeout?: number;
		defResolver?: (...values:any[]) => any;
		saveFail?: boolean;
	}
	export interface ICachePromiseDefResolver {
		(...values:any[]): any;
	}
	export interface ICachePromiseProvider {
		setOptions(options:ICachePromiseOptions): ICachePromiseOptions;
		setDefResolver(resolver: <T>(...values:any[]) => T);
		useAngularDefResolver();
		useJQueryDefResolver();
	}
	interface ICachePromisedObj {
		time?: number;
		promise?: any;
		data?: any; // cached data
		context?: any;
	}

	export var CachePromiseProvider = ["$q", function ($q:ng.IQService) {
		var provider = this,
			serviceProvider = <ICachePromiseProvider>this,
			ngDefResolver = function (...values:any[]) {
				var def = $q.defer();
				def.resolve.apply(this, arguments);
				return def.promise;
			},
			$DefResolver = function (...values:any[]) {
				var def = $.Deferred();
				def.resolve.apply(this, arguments);
				return def.promise();
			},
			defOptions = <ICachePromiseOptions>{
				capacity: null,
				timeout: null,
				saveFail: false,
				defResolver: ngDefResolver
			};

		this.$get = ['$cacheFactory', function ($cacheFactory:ng.ICacheFactoryService) {
			return <ICachePromiseService>function (cacheId:string, options?:ICachePromiseOptions) {
				var me = <ICachePromiseObject>{},
					opt = angular.extend({}, defOptions, options),
					cache = $cacheFactory(cacheId, options);

				me.get = function (key:string, timeout?:number) {
					var cached = cache.get(key),
						now = (new Date()).getTime();
					if (cached && cached.promise) {
						return cached.promise;
					}
					if (cached
						&& (!timeout || (now - cached.time < timeout))
						&& (!opt.timeout || (now - cached.time < opt.timeout))) {
						opt.defResolver.apply(cached.context || this, cached.data);
					}
					return null;
				};
				me.set = function (key:string, promise:any, context?:any) {
					var cached_obj = <ICachePromisedObj>{
						context: context,
						promise: promise
					};

					var fnc = ()=> {
						cached_obj.data = Array.prototype.slice.call(arguments);
						cached_obj.time = (new Date()).getTime();
						delete cached_obj.promise;
					};
					promise.then(fnc, opt.saveFail && fnc);

					cache.put(key, cached_obj);
					return promise;
				};

				me.remove = function (key:string) {
					cache.remove(key);
				};
				me.removeAll = function () {
					cache.removeAll();
				};

				return me;
			};
		}];


		serviceProvider.setOptions = function (options:ICachePromiseOptions) {
			return defOptions = angular.extend({}, defOptions, options);
		};
		serviceProvider.setDefResolver = function (resolver:ICachePromiseDefResolver) {
			if (resolver && angular.isFunction(resolver)) {
				defOptions.defResolver = resolver;
			}
		};
		serviceProvider.useAngularDefResolver = function () {
			defOptions.defResolver = ngDefResolver;
		};
		serviceProvider.useJQueryDefResolver = function () {
			defOptions.defResolver = $DefResolver;
		};
	}];
}

/// angular.module speedshifter.cache-promise