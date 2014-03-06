/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	export interface ILocalStorageConfig {
		valueName: string;
		expires?: number;
		limit?: number;
		json?: boolean;
		user_dependent?: boolean;
		multiple?: boolean;
	}

	export interface ILocalStorageProvider {
		setAppName(name:string);
		addStoreConfig(config:ILocalStorageConfig);
	}

	export interface ILocalStorageService {
		get(valName:string, propertyName?:string);
		set(valName:string, propertyName:string, val, updated?:number);
		remove(valName:string, propertyName?:string, limit?:number);
		setUserId(id); // id could be string, number or object
	}

	export var LocalStorageProvider = ['$log', '$window', function ($log: ng.ILogService, $window: {localStorage: Storage}) {
		var _localStorage = <Storage>((typeof $window.localStorage === 'undefined') ? undefined : $window.localStorage),
			_localStorage_supported = !(typeof _localStorage === 'undefined' || typeof JSON === 'undefined');
		if (!_localStorage_supported) {
			$log.error('LocalStorage is not supported');
		}

		this.name = '';
		this.config = <{[index: string]: ILocalStorageConfig}>{};
		var provider = this,
			serviceProvider = <ILocalStorageProvider>this,
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
						console.error("localStorage LIMIT REACHED: (" + e + ")");
						throw e;
					}
					return value;
				},
				remove: function (key) {
					if (!_localStorage_supported) return false;

					_localStorage.removeItem(key);
					return true;
				}
			};

		this.$get = [function () {
			var me = <ILocalStorageService>{},
				userId = null;

			me.get = function (valName:string, propertyName?:string) {
				var storageValName = provider.name + "." + valName,
					propertyValName = storageValName,
					config = provider.config[valName];
				propertyName && (propertyValName += "." + propertyName);
				if (config) {
					if (config.user_dependent) {
						var id = storage.get(storageValName + '.uid');
						if (!id || id != userId) { // compare as strings
							if (userId) // dont hurry to clean cache if userId is not specified
								me.remove(valName);
							return null;
						}
					}
					if (config.expires) {
						var cached_date = storage.get(propertyValName + '.updated');
						if (cached_date && parseInt(cached_date) > jQuery.now() - config.expires) {
							return storage.get(propertyValName);
						} else {
							storage.remove(propertyValName);
							return null;
						}
					} else {
						return storage.get(propertyValName);
					}
				}
				return storage.get(propertyValName);
			};
			me.set = function (valName:string, propertyName:string, val:any, updated?:number) {
				var storageValName = provider.name + "." + valName,
					propertyValName = storageValName,
					config = provider.config[valName];
				propertyName && (propertyValName += "." + propertyName);
				try {
					if (config) {
						if (config.user_dependent) storage.set(storageValName + '.uid', userId);
						if (config.multiple && config.limit) {
							var count = storage.get(storageValName + '.count');
							count = parseInt(count) || 0;
							if (count >= config.limit)
								return;
							storage.set(storageValName + '.count', count + 1);
						}
						storage.set(propertyValName, val);
						if (config.expires) {
							storage.set(propertyValName + '.updated', updated || jQuery.now());
						}
					} else {
						storage.set(propertyValName, val);
					}
				} catch (e) {
					// console.log("localStorage LIMIT REACHED: (" + e + ")");
					if (config && config.multiple) {
						var limit = 500;
						if (config.limit) limit = Math.floor(config.limit / 2);
						me.remove(valName, null, limit); // try to remove bunch of properties, to make cache available for others
					}
				}
			};
			me.remove = function (valName:string, propertyName?:string, limit?:number) {
				var storageValName = provider.name + "." + valName,
					propertyValName = storageValName,
					config = provider.config[valName];
				propertyName && (propertyValName += "." + propertyName);
				if (config) {
					if (config.multiple && !propertyName) {
						var c = 0, n;
						if (config.user_dependent) limit = null; // ignore limit, if data is user dependent - to remove all values
						// storage.remove(storageValName+'.uid'); // remove user id
						for (var i = 0; i < _localStorage.length; i++) {
							n = _localStorage.key(i);
							if (n.indexOf(storageValName) == 0) {
								storage.remove(n);
								i--;
								console.log("remove", n, storageValName);
								if (limit && ++c >= limit) break;
							}
						}

						if (config.limit) storage.set(storageValName + '.count', Math.max(storage.get(storageValName + '.count') - c, 0));
					} else {
						storageValName += (propertyName ? "." + propertyName : "");
						storage.remove(propertyValName);
						if (config.limit) storage.set(storageValName + '.count', Math.max(storage.get(storageValName + '.count') - 1, 0));
						if (config.user_dependent) storage.remove(storageValName + '.uid');
						if (config.expires) storage.remove(propertyValName + '.updated');
					}
				} else {
					storage.remove(propertyValName);
					if (config.limit) storage.set(storageValName + '.count', Math.max(storage.get(storageValName + '.count') - 1, 0));
					if (config.user_dependent) storage.remove(storageValName + '.uid');
					if (config.expires) storage.remove(propertyValName + '.updated');
				}
			};

			me.setUserId = function (id:any) {
				if (angular.isUndefined(id) || id === '' || id === null || id !== id) return; // don't harry to clean cache

				var id_ = id;
				if (angular.isObject(id)) {
					try {
						id_ = angular.toJson(id);
					} catch (e) {
					}
				}
				userId = "" + id_;
				var confs = <{[index: string]: ILocalStorageConfig}> provider.config,
					storageValName,
					valName;
				for (valName in confs) {
					if (confs[valName].user_dependent) {
						storageValName = provider.name + "." + valName;
						if (storage.get(storageValName + '.uid') != userId) {
							me.remove(valName);
						}
					}
				}
			};
			return me;
		}];

		serviceProvider.setAppName = function (name:string) {
			this.name = name;
		};
		serviceProvider.addStoreConfig = function (config:ILocalStorageConfig) {
			this.config[config.valueName] = config;
		};
	}];
}