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

	export interface ILocalStorageItemWrapper {
		time?: number;
		data?: any; // cached data
		depends?: {[name: string]: any};
	}

	interface ILocalStoragePrivateObject {
		isBelongs(key: string): boolean;
		isInvalid(key: string, now?: number): boolean;
		isCritical(key: string): boolean;
		cleanStorage(delay?: number);
		setCleanInterval(time?: number);
		resetCleanInterval();
		cleanInterval?: ng.IPromise<any>;
		cleanTimeout?: ng.IPromise<any>;
		cleanIntervalTime?: number;
	}

	interface ILocalStorageCacheManager {
		cacheStack: {[id: string]: {cache: ILocalStorageObject; private_cache: ILocalStoragePrivateObject}};
		getCacheObject(id: string): ILocalStorageObject;
		registerCacheObject(id: string, cache: ILocalStorageObject, private_cache: ILocalStoragePrivateObject);
		unregisterCacheObject(id: string);
		clearStorage(): number;
		cleanOnStorageOverflow(limit: number): number;
		cleanStorage(delay?: number): number;
		setCleanInterval(time?: number);
		resetCleanInterval();
		cleanInterval?: ng.IPromise<any>;
		cleanTimeout?: ng.IPromise<any>;
		cleanIntervalTime?: number;
	}

	export class LocalStorageHelpers {
		static compare(dep: ILocalStorageDepend, val) {
			return dep
				&& ((dep.comparator && dep.comparator(dep.value, val))
				|| (dep.value === val)
				|| (angular.isObject(dep.value) && angular.equals(dep.value, val)));
		}
		static getDepend (name: string, depStorages: {[nm:string]: ILocalStorageDepend}[]) {
			for (var i=0; depStorages && i<depStorages.length; i++) {
				if (depStorages[i][name]) {
					return depStorages[i][name];
				}
			}
			return null;
		}
		static isDependentFailed (vals: {[name: string]: any}, deps: string[], depStorages: {[name:string]: ILocalStorageDepend}[]) {
			if (!vals)
				return true;

			var i, name,
				depend;

			if (deps && deps.length > 0) {
				for (i=0; i<deps.length; i++) {
					depend = LocalStorageHelpers.getDepend(deps[i], <{[name:string]: ILocalStorageDepend}[]>depStorages);
					if (!depend
						|| angular.isUndefined(vals[deps[i]])
						|| (depend && !LocalStorageHelpers.compare(depend, vals[deps[i]]))) { // dependency is required, depStorages doesn't contains it, or vals doesn't so
							return true;
					}
				}
			}
			return false;
		}
		static isItemOutdated (item: ILocalStorageItemWrapper, options: ILocalStorageOptions, now: number = (new Date()).getTime()) {
			if (item && !options)
				return false;

			if (!item || !options
				|| (options.expires && !(angular.isDefined(item.time) && (now - item.time < options.expires)))) {
				return true;
			}
			return false;
		}
		static isItemInvalid (item: ILocalStorageItemWrapper, options: ILocalStorageOptions, depStorages: {[name:string]: ILocalStorageDepend}[], now: number = (new Date()).getTime()) {
			if (item && !options)
				return false;
			if (!item || !options || !depStorages
				|| LocalStorageHelpers.isItemOutdated(item, options, now)
				|| (options.dependent && LocalStorageHelpers.isDependentFailed(item.depends, options.dependent, depStorages))) {
				return true;
			}
			return false;
		}
		static composeDeps (dep: string[], depStorages: {[name:string]: ILocalStorageDepend}[]): {[prop: string]: any} {
			if (dep && dep.length > 0) {
				var deps = <{[prop: string]: any}>{},
					i, depend,
					c = 0;
				for (i=0; i<dep.length; i++) {
					depend = LocalStorageHelpers.getDepend(dep[i], depStorages);
					if (depend) {
						deps[dep[i]] = depend.value;
						c++;
					}
				}
				if (c>0)
					return deps;
			}
			return null;
		}
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
				globalDep = <{[name:string]: ILocalStorageDepend}>{};

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
						stack = cacheManager.cacheStack,
						count = 0;
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
					localDep = <{[name:string]: ILocalStorageDepend}>{},
					allDep = [localDep, globalDep],
					private_me = <ILocalStoragePrivateObject> {},
					storageName_regexp = new RegExp("^" + storageValName + ITEMS_NAME_DELIMITER_REG_SAFE + ".*", "i"),
					_options;

				me.setOptions = function(_options_:ILocalStorageOptions) {
					_options = <ILocalStorageOptions>angular.extend({}, provider.defOptions, _options_);
				};
				me.setOptions(options);

				me.getLocalStorageKey = function(valName:string){
					return storageValName + ITEMS_NAME_DELIMITER + (valName || '');
				};

				me.get = function (valName:string) {
					var propertyName = me.getLocalStorageKey(valName),
						item = <ILocalStorageItemWrapper>storage.get(propertyName);
					if (item) {
						if (LocalStorageHelpers.isItemInvalid(storage.get(propertyName), _options, allDep)) {
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
							time: (new Date()).getTime(),
							depends: LocalStorageHelpers.composeDeps(_options.dependent, allDep)
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
						globalDep[dep.name] = dep;
						cacheManager.cleanStorage(5*1000); // no need to remove it immediately
					} else {
						localDep[dep.name] = dep;
						private_me.cleanStorage(5*1000); // no need to remove it immediately
					}
				};

				me.removeDependence = function(name: string, global?: boolean) {
					if (global) {
						delete globalDep[name];
						cacheManager.cleanStorage(10*1000); // no need to remove it immediately
					} else {
						delete localDep[name];
						private_me.cleanStorage(10*1000); // no need to remove it immediately
					}
				};

				me.setDependenceVal = function(name: string, val: any, global?: boolean) {
					if (global) {
						if (globalDep[name])
							globalDep[name].value = val;
						else
							globalDep[name] = <ILocalStorageDepend> {
								name: name,
								value: val
							};
						cacheManager.cleanStorage(5*1000);
					} else {
						if (localDep[name])
							localDep[name].value = val;
						else
							localDep[name] = <ILocalStorageDepend> {
								name: name,
								value: val
							};
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
				private_me.isInvalid = function(key: string, now: number = (new Date()).getTime()) {
					if (private_me.isBelongs(key)) {
						return LocalStorageHelpers.isItemInvalid(storage.get(key), _options, allDep, now);
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