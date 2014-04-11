/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	export interface ILocalStorageOptions {
		expires?: number; // expiration time in ms
		dependent?: string[]; // dependencies, array of strings
		critical?: boolean; // if true, values shouldn't be removed because of localStorage overflow
		cleanTimeout?: number; // timeout to check depends
	}

	export interface ILocalStorageDepend {
		name: string;
		value: any;
		comparator?: (item1: any, item2: any) => boolean;
	}

	export interface ILocalStorageProvider {
		setAppName(name:string);
		setDefOptions(options:ILocalStorageOptions);
	}

	export interface ILocalStorageService {
		(cacheId:string, options?:ILocalStorageOptions): ILocalStorageObject;
	}

	export interface ILocalStorageObject {
		getLocalStorageKey(valName:string);
		get(valName:string);
		set(valName:string, val, updated?:number);
		remove(valName:string);
		clear(); // clear all bunch of items
		clearStorage(); // clear all storage totally, but only registered items
		setDependence(dep: ILocalStorageDepend, global?: boolean);
		removeDependence(name: string, global?: boolean);
		setDependenceVal(name: string, val: any, global?: boolean);
		setOptions(options:ILocalStorageOptions);
	}

	export interface ILocalStorageItemWrapper extends IDepCheckerItemWrapper{
		data?: any; // cached data
	}

	interface ILocalStorageCleanable {
		cleanStorage(delay?: number);
		setCleanInterval(time?: number);
		resetCleanInterval();
		cleanInterval?: ng.IPromise<any>;
		cleanTimeout?: ng.IPromise<any>;
		cleanIntervalTime?: number;
	}

	interface ILocalStoragePrivateObject extends ILocalStorageCleanable{
		isBelongs(key: string): boolean;
		isInvalid(key: string, now?: number): boolean;
		isCritical(key: string): boolean;
	}

	interface ILocalStorageCacheManager extends ILocalStorageCleanable {
		cacheStack: {[id: string]: {cache: ILocalStorageObject; private_cache: ILocalStoragePrivateObject}};
		getCacheObject(id: string): ILocalStorageObject;
		registerCacheObject(id: string, cache: ILocalStorageObject, private_cache: ILocalStoragePrivateObject);
		unregisterCacheObject(id: string);
		clearStorage(): number;
		cleanOnStorageOverflow(limit: number): number;
	}


	export var LocalStorageProvider = function () {
		var provider = <any>this,
			serviceProvider = <ILocalStorageProvider>this,
			ITEMS_NAME_DELIMITER = ".",
			ITEMS_NAME_DELIMITER_REG_SAFE = "\\.",
			DEF_CLEAN_INTERVAL = 5*60*1000;

		provider.name = 'ngLocalStorage';
		provider.defOptions = <ILocalStorageOptions>{};

		this.$get = ['$log', '$window', '$interval', '$timeout', function ($log: ng.ILogService, $window: {localStorage: Storage}, $interval: ng.IIntervalService, $timeout: ng.ITimeoutService) {
			var _localStorage = <Storage>((typeof $window.localStorage === 'undefined') ? undefined : $window.localStorage),
				_localStorage_supported = !(typeof _localStorage === 'undefined' || typeof JSON === 'undefined'),
				storage = {
					get: function (key) {
						if (!_localStorage_supported) return null;

						var item = _localStorage.getItem(key);
						try {
							var val = JSON.parse(item);
							if (typeof val === 'undefined') {
								val = item;
							}
							if (val === 'true') {
								val = true;
							} else
							if (val === 'false') {
								val = false;
							}
							return val;
						} catch (e) {
							return item;
						}
					},
					set: function (key, value) {
						if (!_localStorage_supported) return null;
						try {
							_localStorage.setItem(key, JSON.stringify(value));
						} catch(e) {
							$log.error("localStorage LIMIT REACHED: (" + e + ")");
							throw e;
						}
						return value;
					},
					remove: function (key) {
						if (!_localStorage_supported) return false;

						_localStorage.removeItem(key);
						return true;
					}
				},
				cacheManager = <ILocalStorageCacheManager> {
					cacheStack: {}
				},
				globalDep = new DepStorage();

			cacheManager.getCacheObject = function (id: string) {
				return (cacheManager.cacheStack[id] && cacheManager.cacheStack[id].cache) || null;
			};
			cacheManager.registerCacheObject = function(id: string, cache: ILocalStorageObject, private_cache: ILocalStoragePrivateObject) {
				if (cacheManager.getCacheObject(id))
					return cacheManager.getCacheObject(id);
				cacheManager.cacheStack[id] = {cache: cache, private_cache: private_cache};
				return cacheManager.cacheStack[id].cache;
			};
			cacheManager.unregisterCacheObject = function(id: string) {
				delete cacheManager.cacheStack[id];
			};
			cacheManager.cleanStorage = function (delay?:number) {
				if (!_localStorage_supported) return;

				if (angular.isDefined(delay) && angular.isNumber(delay)) {
					$timeout.cancel(cacheManager.cleanTimeout);
					cacheManager.cleanTimeout = $timeout(cacheManager.cleanStorage, delay);
					return 0;
				}

				var i, key, j,
					stack = cacheManager.cacheStack,
					count = 0,
					now = (new Date()).getTime();

				for (i = 0; i < _localStorage.length; i++) {
					key = _localStorage.key(i);
					for (j in stack) {
						try{
							if (stack[j].private_cache.isInvalid(key, now)) {
								storage.remove(key);
								i--;
								count++;
								break;
							}
						} catch (e) {}
					}
				}
				cacheManager.resetCleanInterval();
				return count;
			};
			cacheManager.cleanOnStorageOverflow = function (limit: number) {
				if (!_localStorage_supported) return;

				var count = cacheManager.cleanStorage();

				if (limit && count < limit) {
					var i, key, j,
						stack = cacheManager.cacheStack;
					for (i = 0; i < _localStorage.length; i++) {
						key = _localStorage.key(i);
						for (j in stack) {
							try{
								if (stack[j].private_cache.isCritical(key)) {
									storage.remove(key);
									i--;
									count++;
									break;
								}
							} catch (e) {}
						}
						if (limit && count >= limit)
							break;
					}
				}
				return count;
			};
			cacheManager.clearStorage = function () {
				if (!_localStorage_supported) return;

				var i, key, j,
					stack = cacheManager.cacheStack,
					count = 0;
				for (i = 0; i < _localStorage.length; i++) {
					key = _localStorage.key(i);
					for (j in stack) {
						try{
							if (stack[j].private_cache.isBelongs(key)) {
								storage.remove(key);
								i--;
								count++;
								break;
							}
						} catch (e) {}
					}
				}
				return count;
			};
			cacheManager.setCleanInterval = function(time: number = DEF_CLEAN_INTERVAL) {
				cacheManager.cleanIntervalTime = time;
				$interval.cancel(cacheManager.cleanInterval);
				cacheManager.cleanInterval = $interval(cacheManager.cleanStorage, time);
			};
			cacheManager.resetCleanInterval = function() {
				cacheManager.setCleanInterval(cacheManager.cleanIntervalTime); // reset cleanInterval
				for (var i in cacheManager.cacheStack) {                       // reset other intervals, as cacheManager.cleanStorage processes all items
					cacheManager.cacheStack[i].private_cache.resetCleanInterval();
				}
			};
			cacheManager.setCleanInterval(provider.defOptions.cleanTimeout);
			cacheManager.cleanStorage(10*1000); // try to clean old values

			if (!_localStorage_supported) {
				$log.error('LocalStorage is not supported');
			}

			return <ILocalStorageService>function(cacheId: string, options?: ILocalStorageOptions) {
				var storageValName = provider.name + ITEMS_NAME_DELIMITER + cacheId;
				if (cacheManager.getCacheObject(storageValName)) {
					$log.log(cacheId + " localStorage already exists.");
					return cacheManager.getCacheObject(storageValName);
				}

				var me = <ILocalStorageObject>{},
					localDep = new DepStorage(globalDep),
					private_me = <ILocalStoragePrivateObject> {},
					storageName_regexp = new RegExp("^" + storageValName + ITEMS_NAME_DELIMITER_REG_SAFE + ".*", "i"),
					_options,
					depChecker = new DepChecker(options, localDep);

				me.setOptions = function(_options_:ILocalStorageOptions) {
					_options = <ILocalStorageOptions>angular.extend({}, provider.defOptions, _options_);
					depChecker.setOptions(_options);
				};
				me.setOptions(options);

				me.getLocalStorageKey = function(valName:string){
					return storageValName + ITEMS_NAME_DELIMITER + (valName || '');
				};

				me.get = function (valName:string) {
					var propertyName = me.getLocalStorageKey(valName),
						item = <ILocalStorageItemWrapper>storage.get(propertyName);
					if (item) {
						if (depChecker.isItemInvalid(item)) {
							storage.remove(propertyName);
							return null;
						}
						return item.data;
					} else {
						return null;
					}
					return item.data;
				};

				me.set = function (valName:string, val:any) {
					var propertyName = me.getLocalStorageKey(valName),
						item = <ILocalStorageItemWrapper>{
							data: val,
							time: ExpirationChecker.now(),
							depends: localDep.composeDeps(_options.dependent)
						};
					try {
						storage.set(propertyName, item);
					} catch (e) {
						$log.log("localStorage LIMIT REACHED: (" + e + ")");
						$timeout(cacheManager.cleanOnStorageOverflow, 0);
					}
				};

				me.remove = function (valName:string) {
					var propertyName = me.getLocalStorageKey(valName);
					storage.remove(propertyName);
				};

				me.clear = function () {
					if (!_localStorage_supported) return;

					var i, key;
					for (i = 0; i < _localStorage.length; i++) {
						key = _localStorage.key(i);
						if (private_me.isBelongs(key)) {
							storage.remove(key);
							i--;
						}
					}
				};

				me.clearStorage = function () {
					cacheManager.clearStorage(); // try to remove all items
				};

				me.setDependence = function(dep: ILocalStorageDepend, global?: boolean) {
					if (global) {
						globalDep.setDependence(dep);
						cacheManager.cleanStorage(5*1000); // no need to remove it immediately
					} else {
						localDep.setDependence(dep);
						private_me.cleanStorage(5*1000); // no need to remove it immediately
					}
				};

				me.removeDependence = function(name: string, global?: boolean) {
					if (global) {
						globalDep.removeDependence(name);
						cacheManager.cleanStorage(10*1000); // no need to remove it immediately
					} else {
						localDep.removeDependence(name);
						private_me.cleanStorage(10*1000); // no need to remove it immediately
					}
				};

				me.setDependenceVal = function(name: string, val: any, global?: boolean) {
					if (global) {
						globalDep.setDependenceVal(name, val);
						cacheManager.cleanStorage(5*1000);
					} else {
						localDep.setDependenceVal(name, val);
						private_me.cleanStorage(5*1000);
					}
				};

				private_me.cleanStorage = function(delay?:number, dep_name?: string) {
					if (!_localStorage_supported) return;

					if (angular.isDefined(delay) && angular.isNumber(delay)) {
						$timeout.cancel(private_me.cleanTimeout);
						private_me.cleanTimeout = $timeout(private_me.cleanStorage, delay);
						return 0;
					}

					var i, key,
						count = 0,
						now = (new Date()).getTime();

					for (i = 0; i < _localStorage.length; i++) {
						key = _localStorage.key(i);
						if (private_me.isInvalid(key, now)) {
							storage.remove(key);
							i--;
						}
					}
					private_me.resetCleanInterval();
					return count;
				};
				private_me.isBelongs = function (key: string) {
					return storageName_regexp.test(key);
				};
				private_me.isInvalid = function(key: string, now?: number) {
					if (private_me.isBelongs(key)) {
						return depChecker.isItemInvalid(storage.get(key), now);
					}
					return false;
				};
				private_me.isCritical = function (key: string) {
					return private_me.isBelongs(key) && _options.critical;
				};
				private_me.setCleanInterval = function(time: number = DEF_CLEAN_INTERVAL) {
					private_me.cleanIntervalTime = time;
					$interval.cancel(private_me.cleanInterval);
					private_me.cleanInterval = $interval(private_me.cleanStorage, time);
				};
				private_me.resetCleanInterval = function() {
					private_me.setCleanInterval(private_me.cleanIntervalTime);
				};
				private_me.setCleanInterval(_options.cleanTimeout);

				cacheManager.registerCacheObject(storageValName, me, private_me);

				return me;
			};
		}];
		serviceProvider.setAppName = function (name:string) {
			provider.name = name;
		};
		serviceProvider.setDefOptions = function(options:ILocalStorageOptions) {
			provider.defOptions = <ILocalStorageOptions>angular.extend({}, provider.defOptions, options);
		};
	};

	var module = angular.module('speedshifter.localStoragePromise', []);
	module.provider('localStoragePromise', LocalStorageProvider);
}