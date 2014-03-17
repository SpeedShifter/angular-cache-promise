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
		get(valName:string);
		set(valName:string, val, updated?:number);
		remove(valName:string, limit?:number);
		clear(); // clear all bunch of items
		clearStorage(); // clear all storage totally, but only registered items
		setDependence(dep: ILocalStorageDepend, global?: boolean);
		setDependenceVal(name: string, val: any, global?: boolean);
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
		cleanStorage();
		setClearInterval(time?: number);
		clearInterval: ng.IPromise<any>;
	}

	interface ILocalStorageCacheManager {
		cacheStack: {[id: string]: {cache: ILocalStorageObject; private_cache: ILocalStoragePrivateObject}};
		getCacheObject(id: string): ILocalStorageObject;
		registerCacheObject(id: string, cache: ILocalStorageObject, private_cache: ILocalStoragePrivateObject);
		unregisterCacheObject(id: string);
		cleanStorage(): number;
		cleanOnStorageOverflow(limit: number): number;
		clearStorage(): number;
		setClearInterval(time?: number);
		clearInterval: ng.IPromise<any>;
	}

	export class LocalStorageHelpers {
		static compare(dep: ILocalStorageDepend, val) {
			return dep
				&& ((dep.comparator && dep.comparator(dep.value, val))
				|| (dep.value === val));
		}
		static getDepend (name: string, depStorages: {[nm:string]: ILocalStorageDepend}[]) {
			for (var i=0; depStorages && i<depStorages.length; i++) {
				if (depStorages[i][name]) {
					return depStorages[i][name];
				}
			}
			return undefined;
		}
		static isDependentFailed (vals: {[name: string]: any}, deps: string[], depStorages: {[name:string]: ILocalStorageDepend}[]) {
			if (!vals)
				return true;

			var i, name,
				depend;

			if (deps && deps.length > 0) {
				for (i=0; i<deps.length; i++) {
					depend = LocalStorageHelpers.getDepend(deps[i], <{[name:string]: ILocalStorageDepend}[]>depStorages);
					if ((depend && !LocalStorageHelpers.compare(depend, vals[deps[i]])) ||
						(!depend && angular.isDefined(vals[deps[i]]))) { // dependency is required, depStorages doesn't contains it, but vals contains, so compare is failed
							return true;
					}
				}
			}
			return false;
		}
		static isItemOutdated (item: ILocalStorageItemWrapper, options: ILocalStorageOptions, now: number = (new Date()).getTime()) {
			if (!item || !options
				|| (options.expires && !(item.time && item.time + options.expires > now))) {
				return true;
			}
			return false;
		}
		static isItemInvalid (item: ILocalStorageItemWrapper, options: ILocalStorageOptions, depStorages: {[name:string]: ILocalStorageDepend}[], now: number = (new Date()).getTime()) {
			if (!item || !options || !depStorages
				|| LocalStorageHelpers.isItemOutdated(item, options, now)
				|| (options.dependent && LocalStorageHelpers.isDependentFailed(item.depends, options.dependent, depStorages))) {
				return true;
			}
			return false;
		}
		static composeDeps (dep: string[], depStorages: {[name:string]: ILocalStorageDepend}[]) {
			if (dep && dep.length > 0) {
				var deps = {},
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
			return undefined;
		}
	}

	export var LocalStorageProvider = function () {
		var provider = <any>this,
			serviceProvider = <ILocalStorageProvider>this,
			ITEMS_NAME_DELIMITER = ".",
			ITEMS_NAME_DELIMITER_REG_SAFE = "\\.",
			DEF_CLEAN_INTERVAL = 5*60*1000;

		provider.name = '';
		provider.defOptions = <ILocalStorageOptions>{};

		this.$get = ['$log', '$window', '$interval', function ($log: ng.ILogService, $window: {localStorage: Storage}, $interval: ng.IIntervalService) {
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
			cacheManager.cleanStorage = function () {
				if (!_localStorage_supported) return;

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
								count++;
								break;
							}
						} catch (e) {}
					}
				}
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
								count++;
								break;
							}
						} catch (e) {}
					}
				}
				return count;
			};
			cacheManager.setClearInterval = function(time: number = DEF_CLEAN_INTERVAL) {
				$interval.cancel(cacheManager.clearInterval);
				cacheManager.clearInterval = $interval(cacheManager.cleanStorage, time);
			};
			cacheManager.setClearInterval(provider.defOptions.cleanTimeout);
			setTimeout(cacheManager.cleanStorage, 10*1000); // try to clean old values

			if (!_localStorage_supported) {
				$log.error('LocalStorage is not supported');
			}

			return <ILocalStorageService>function(cacheId: string, options?: ILocalStorageOptions) {
				var storageValName = provider.name + ITEMS_NAME_DELIMITER + cacheId;
				if (cacheManager.getCacheObject(storageValName)) {
					$log.log(cacheId + " localStorage already exists.");
					return cacheManager.getCacheObject(storageValName);
				}

				options = <ILocalStorageOptions>angular.extend({}, provider.defOptions, options);
				var storageName_regexp = new RegExp("^" + storageValName + ITEMS_NAME_DELIMITER_REG_SAFE, "gi");

				var me = <ILocalStorageObject>{},
					localDep = <{[name:string]: ILocalStorageDepend}>{},
					allDep = [localDep, globalDep],
					private_me = <ILocalStoragePrivateObject> {};

				me.get = function (valName:string) {
					var propertyName = storageValName + ITEMS_NAME_DELIMITER + valName,
						item = <ILocalStorageItemWrapper>storage.get(propertyName);
					if (item) {
						if (LocalStorageHelpers.isItemInvalid(storage.get(propertyName), options, allDep)) {
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
					var propertyName = storageValName + ITEMS_NAME_DELIMITER + valName,
						item = <ILocalStorageItemWrapper>{
							data: val,
							time: (new Date()).getTime(),
							depends: LocalStorageHelpers.composeDeps(options.dependent, allDep)
						};
					try {
						storage.set(propertyName, item);
					} catch (e) {
						$log.log("localStorage LIMIT REACHED: (" + e + ")");
						setTimeout(cacheManager.cleanOnStorageOverflow, 0);
					}
				};

				me.remove = function (valName:string) {
					var propertyName = storageValName + ITEMS_NAME_DELIMITER + valName;
					storage.remove(propertyName);
				};

				me.clear = function () {
					if (!_localStorage_supported) return;

					var i, key;
					for (i = 0; i < _localStorage.length; i++) {
						key = _localStorage.key(i);
						if (private_me.isBelongs(key)) {
							storage.remove(key);
						}
					}
				};

				me.clearStorage = function () {
					cacheManager.clearStorage(); // try to remove all items
				};

				me.setDependence = function(dep: ILocalStorageDepend, global?: boolean) {
					if (global) {
						globalDep[dep.name] = dep;
						cacheManager.cleanStorage();
					} else {
						localDep[dep.name] = dep;
						private_me.cleanStorage();
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
						cacheManager.cleanStorage();
					} else {
						if (localDep[name])
							localDep[name].value = val;
						else
							localDep[name] = <ILocalStorageDepend> {
								name: name,
								value: val
							};
						private_me.cleanStorage();
					}
				};

				private_me.cleanStorage = function(dep_name?: string) {
					if (!_localStorage_supported) return;

					console.error("cleanStorage", cacheId);

					var i, key,
						count = 0,
						now = (new Date()).getTime();
					for (i = 0; i < _localStorage.length; i++) {
						key = _localStorage.key(i);
						if (private_me.isInvalid(key, now)) {
							storage.remove(key);
						}
					}
					return count;
				};
				private_me.isBelongs = function (key: string) {
					return storageName_regexp.test(key);
				};
				private_me.isInvalid = function(key: string, now: number = (new Date()).getTime()) {
					if (private_me.isBelongs(key)) {
						return LocalStorageHelpers.isItemInvalid(storage.get(key), options, allDep, now);
					}
					return false;
				};
				private_me.isCritical = function (key: string) {
					return private_me.isBelongs(key) && options.critical;
				};
				private_me.setClearInterval = function(time: number = DEF_CLEAN_INTERVAL) {
					$interval.cancel(private_me.clearInterval);
					if (time != provider.defOptions.cleanTimeout) {  // if intervals are same as global interval, no need to create it here
						private_me.clearInterval = $interval(private_me.cleanStorage, time);
					}
				};
				private_me.setClearInterval(options.cleanTimeout);

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