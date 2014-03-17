/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	'use strict';
	export interface ICachePromiseObject {
		get<T>(key: string, timeout?: number): T;

		set(key: string, promise: JQueryPromise<any>, context?: any): JQueryPromise<any>;
		set(key: string, promise: ng.IPromise<any>, context?: any): ng.IPromise<any>;

		remove(key: string): any;
		removeAll(): any;
	}
	export interface ICachePromiseService {
		(cacheId:string, optionsMap?:ICachePromiseOptions): ICachePromiseObject;
	}
	export interface ICachePromiseOptions {
		capacity?: number; // for angular $cacheFactory
		timeout?: number;
		defResolver?: ICachePromiseDefResolver<any>;
		JQPromise?: boolean;
		saveFail?: boolean;
	}
	export interface ICachePromiseDefResolver<T> {
		(...values:any[]): T;
	}
	export interface ICachePromiseProvider {
		setOptions(options:ICachePromiseOptions): ICachePromiseOptions;
	}
	interface ICachePromisedObj {
		time?: number;
		promise?: any;
		data?: any; // cached data
		context?: any;
	}

	export var CachePromiseProvider = function () {
		var serviceProvider = <ICachePromiseProvider>this,
			defOptions = <ICachePromiseOptions>{
				capacity: null,
				timeout: null,
				saveFail: false,
				defResolver: null,
				JQPromise: false
			};

		this.$get = ['$q', '$cacheFactory', function ($q:ng.IQService, $cacheFactory:ng.ICacheFactoryService) {
			var ngDefResolver = <ICachePromiseDefResolver<ng.IPromise<any>>> function (...values:any[]) {
					var def = $q.defer();
					def.resolve.apply(this, values);
					return def.promise;
				},
				$DefResolver = <ICachePromiseDefResolver<JQueryPromise<any>>> function (...values:any[]) {
					var def = $.Deferred();
					def.resolve.apply(this, values);
					return def.promise();
				};

			return <ICachePromiseService>function (cacheId:string, options?:ICachePromiseOptions) {
				var me = <ICachePromiseObject>{},
					opt = <ICachePromiseOptions>angular.extend({}, defOptions, options),
					cache = $cacheFactory(cacheId, options);

				if (!opt.defResolver || !angular.isFunction(opt.defResolver)) {
					if (opt.JQPromise) opt.defResolver = <ICachePromiseDefResolver<any>>$DefResolver;
					else  opt.defResolver = <ICachePromiseDefResolver<any>>ngDefResolver;
				}

				me.get = function (key:string, timeout?:number) {
					var cached = cache.get(key),
						now = (new Date()).getTime();
					if (cached && cached.promise) {
						return cached.promise;
					}
					if (cached
						&& (!timeout || (now - cached.time < timeout))
						&& (!opt.timeout || (now - cached.time < opt.timeout))) {
						return opt.defResolver.apply(cached.context || this, cached.data);
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
	};

	var module = angular.module('speedshifter.cachePromise', []);
	module.provider('cachePromise', CachePromiseProvider);
}