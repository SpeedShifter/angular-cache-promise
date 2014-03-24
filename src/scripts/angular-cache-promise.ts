/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	'use strict';
	export interface ICachePromiseObject {
		get<T>(key: string, timeout?: number): T;

		set(key: string, promise: JQueryPromise<any>): JQueryPromise<any>;
		set(key: string, promise: ng.IPromise<any>): ng.IPromise<any>;

		remove(key: string): any;
		removeAll(): any;

		setOptions(options?:ICachePromiseOptions);
	}
	export interface ICachePromiseService {
		(cacheId:string, options?:ICachePromiseOptions): ICachePromiseObject;
	}
	export interface ICachePromiseOptions {
		capacity?: number; // for angular $cacheFactory
		timeout?: number;
		dontSaveResult?: boolean; // same as to set timeout as 0
		defResolver?: ICachePromiseDefResolver<any>;
		JQPromise?: boolean;
		saveFail?: boolean;
	}
	export interface ICachePromiseDefResolver<T> {
		(values: any[], failed?: boolean): T;
	}
	export interface ICachePromiseProvider {
		setOptions(options:ICachePromiseOptions): ICachePromiseOptions;
	}
	interface ICachePromisedObj {
		time?: number;
		promise?: any;
		failed?: boolean;
		data?: any; // cached data
	}

	export var CachePromiseProvider = function () {
		var serviceProvider = <ICachePromiseProvider>this,
			defOptions = <ICachePromiseOptions>{}, // everything is undefined
			cacheStore = <{[id:string] : ICachePromiseObject}>{};

		this.$get = ['$q', '$cacheFactory', function ($q:ng.IQService, $cacheFactory:ng.ICacheFactoryService) {
			var ngDefResolver = <ICachePromiseDefResolver<ng.IPromise<any>>> function (values:any[], failed?: boolean) {
					var def = $q.defer();
					(!failed ? def.resolve : def.reject) .apply(this, values);
					return def.promise;
				},
				$DefResolver = <ICachePromiseDefResolver<JQueryPromise<any>>> function (values:any[], failed?: boolean) {
					var def = $.Deferred();
					(!failed ? def.resolve : def.reject) .apply(this, values);
					return def.promise();
				};

			return <ICachePromiseService>function (cacheId:string, options?:ICachePromiseOptions) {
				if (cacheStore[cacheId])
					return cacheStore[cacheId];

				var me = cacheStore[cacheId] = <ICachePromiseObject>{},
					opt, // local optionsobject
					cache = $cacheFactory(cacheId, options);


				me.setOptions = function(_options?:ICachePromiseOptions) {
					opt = <ICachePromiseOptions>angular.extend({}, defOptions, _options);

					if (!opt.defResolver || !angular.isFunction(opt.defResolver)) {
						if (opt.JQPromise) opt.defResolver = <ICachePromiseDefResolver<any>>$DefResolver;
						else  opt.defResolver = <ICachePromiseDefResolver<any>>ngDefResolver;
					}
				};
				me.setOptions(options);

				me.get = function (key:string, timeout?:number) {
					var cached = cache.get(key),
						now = (new Date()).getTime();
					if (cached && cached.promise) {
						return cached.promise;
					}
					if (cached) {
						if ((!timeout || (now - cached.time < timeout))
							&& (!opt.timeout || (now - cached.time < opt.timeout))) {
							return opt.defResolver(cached.data, cached.failed);
						} else
							cache.remove(key);
					}
					return null;
				};
				me.set = function (key:string, promise:any) {
					var cached_obj = <ICachePromisedObj>{
						promise: promise
					};

					var fnc = (...values:any[])=> {
							cached_obj.data = values;
							cached_obj.time = (new Date()).getTime();
							delete cached_obj.promise;
							if (opt.dontSaveResult || opt.timeout === 0) {
								cache.remove(key);
							}
						},
						fail_fnc = opt.saveFail ? (...values:any[])=> {
							cached_obj.failed = true;
							cached_obj.data = values;
							cached_obj.time = (new Date()).getTime();
							delete cached_obj.promise;
							if (opt.dontSaveResult || opt.timeout === 0) {
								cache.remove(key);
							}
						} : () => {
							delete cached_obj.promise;
							cache.remove(key);
						};
					promise.then(fnc, fail_fnc);

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
	};

	var module = angular.module('speedshifter.cachePromise', []);
	module.provider('cachePromise', CachePromiseProvider);
}