var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        Services.LocalStorageProvider = function () {
            var provider = this, serviceProvider = this, ITEMS_NAME_DELIMITER = ".", ITEMS_NAME_DELIMITER_REG_SAFE = "\\.", DEF_CLEAN_INTERVAL = 5 * 60 * 1000;

            provider.name = 'ngLocalStorage';
            provider.defOptions = {};

            this.$get = [
                '$log', '$window', '$interval', '$timeout', function ($log, $window, $interval, $timeout) {
                    var _localStorage = ((typeof $window.localStorage === 'undefined') ? undefined : $window.localStorage), _localStorage_supported = !(typeof _localStorage === 'undefined' || typeof JSON === 'undefined'), storage = {
                        get: function (key) {
                            if (!_localStorage_supported)
                                return null;

                            var item = _localStorage.getItem(key);
                            try  {
                                var val = JSON.parse(item);
                                if (typeof val === 'undefined') {
                                    val = item;
                                }
                                if (val === 'true') {
                                    val = true;
                                } else if (val === 'false') {
                                    val = false;
                                }
                                return val;
                            } catch (e) {
                                return item;
                            }
                        },
                        set: function (key, value) {
                            if (!_localStorage_supported)
                                return null;
                            try  {
                                _localStorage.setItem(key, JSON.stringify(value));
                            } catch (e) {
                                $log.error("localStorage LIMIT REACHED: (" + e + ")");
                                throw e;
                            }
                            return value;
                        },
                        remove: function (key) {
                            if (!_localStorage_supported)
                                return false;

                            _localStorage.removeItem(key);
                            return true;
                        }
                    }, cacheManager = {
                        cacheStack: {}
                    }, globalDep = new SpeedShifter.Services.DepStorage();

                    cacheManager.getCacheObject = function (id) {
                        return (cacheManager.cacheStack[id] && cacheManager.cacheStack[id].cache) || null;
                    };
                    cacheManager.registerCacheObject = function (id, cache, private_cache) {
                        if (cacheManager.getCacheObject(id))
                            return cacheManager.getCacheObject(id);
                        cacheManager.cacheStack[id] = { cache: cache, private_cache: private_cache };
                        return cacheManager.cacheStack[id].cache;
                    };
                    cacheManager.unregisterCacheObject = function (id) {
                        delete cacheManager.cacheStack[id];
                    };
                    cacheManager.cleanStorage = function (delay) {
                        if (!_localStorage_supported)
                            return;

                        if (angular.isDefined(delay) && angular.isNumber(delay)) {
                            $timeout.cancel(cacheManager.cleanTimeout);
                            cacheManager.cleanTimeout = $timeout(cacheManager.cleanStorage, delay);
                            return 0;
                        }

                        var i, key, j, stack = cacheManager.cacheStack, count = 0, now = (new Date()).getTime();

                        for (i = 0; i < _localStorage.length; i++) {
                            key = _localStorage.key(i);
                            for (j in stack) {
                                try  {
                                    if (stack[j].private_cache.isInvalid(key, now)) {
                                        storage.remove(key);
                                        i--;
                                        count++;
                                        break;
                                    }
                                } catch (e) {
                                }
                            }
                        }
                        cacheManager.resetCleanInterval();
                        return count;
                    };
                    cacheManager.cleanOnStorageOverflow = function (limit) {
                        if (!_localStorage_supported)
                            return;

                        var count = cacheManager.cleanStorage();

                        if (limit && count < limit) {
                            var i, key, j, stack = cacheManager.cacheStack;
                            for (i = 0; i < _localStorage.length; i++) {
                                key = _localStorage.key(i);
                                for (j in stack) {
                                    try  {
                                        if (stack[j].private_cache.isCritical(key)) {
                                            storage.remove(key);
                                            i--;
                                            count++;
                                            break;
                                        }
                                    } catch (e) {
                                    }
                                }
                                if (limit && count >= limit)
                                    break;
                            }
                        }
                        return count;
                    };
                    cacheManager.clearStorage = function () {
                        if (!_localStorage_supported)
                            return;

                        var i, key, j, stack = cacheManager.cacheStack, count = 0;
                        for (i = 0; i < _localStorage.length; i++) {
                            key = _localStorage.key(i);
                            for (j in stack) {
                                try  {
                                    if (stack[j].private_cache.isBelongs(key)) {
                                        storage.remove(key);
                                        i--;
                                        count++;
                                        break;
                                    }
                                } catch (e) {
                                }
                            }
                        }
                        return count;
                    };
                    cacheManager.setCleanInterval = function (time) {
                        if (typeof time === "undefined") { time = DEF_CLEAN_INTERVAL; }
                        cacheManager.cleanIntervalTime = time;
                        $interval.cancel(cacheManager.cleanInterval);
                        cacheManager.cleanInterval = $interval(cacheManager.cleanStorage, time);
                    };
                    cacheManager.resetCleanInterval = function () {
                        cacheManager.setCleanInterval(cacheManager.cleanIntervalTime);
                        for (var i in cacheManager.cacheStack) {
                            cacheManager.cacheStack[i].private_cache.resetCleanInterval();
                        }
                    };
                    cacheManager.setCleanInterval(provider.defOptions.cleanTimeout);
                    cacheManager.cleanStorage(10 * 1000);

                    if (!_localStorage_supported) {
                        $log.error('LocalStorage is not supported');
                    }

                    return function (cacheId, options) {
                        var storageValName = provider.name + ITEMS_NAME_DELIMITER + cacheId;
                        if (cacheManager.getCacheObject(storageValName)) {
                            $log.log(cacheId + " localStorage already exists.");
                            return cacheManager.getCacheObject(storageValName);
                        }

                        var me = {}, localDep = new SpeedShifter.Services.DepStorage(globalDep), private_me = {}, storageName_regexp = new RegExp("^" + storageValName + ITEMS_NAME_DELIMITER_REG_SAFE + ".*", "i"), _options, depChecker = new SpeedShifter.Services.DepChecker(options, localDep);

                        me.setOptions = function (_options_) {
                            _options = angular.extend({}, provider.defOptions, _options_);
                            depChecker.setOptions(_options);
                        };
                        me.setOptions(options);

                        me.getLocalStorageKey = function (valName) {
                            return storageValName + ITEMS_NAME_DELIMITER + (valName || '');
                        };

                        me.get = function (valName) {
                            var propertyName = me.getLocalStorageKey(valName), item = storage.get(propertyName);
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

                        me.set = function (valName, val) {
                            var propertyName = me.getLocalStorageKey(valName), item = {
                                data: val,
                                time: SpeedShifter.Services.ExpirationChecker.now(),
                                depends: localDep.composeDeps(_options.dependent)
                            };
                            try  {
                                storage.set(propertyName, item);
                            } catch (e) {
                                $log.log("localStorage LIMIT REACHED: (" + e + ")");
                                $timeout(cacheManager.cleanOnStorageOverflow, 0);
                            }
                        };

                        me.remove = function (valName) {
                            var propertyName = me.getLocalStorageKey(valName);
                            storage.remove(propertyName);
                        };

                        me.clear = function () {
                            if (!_localStorage_supported)
                                return;

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
                            cacheManager.clearStorage();
                        };

                        me.setDependence = function (dep, global) {
                            if (global) {
                                globalDep.setDependence(dep);
                                cacheManager.cleanStorage(5 * 1000);
                            } else {
                                localDep.setDependence(dep);
                                private_me.cleanStorage(5 * 1000);
                            }
                        };

                        me.removeDependence = function (name, global) {
                            if (global) {
                                globalDep.removeDependence(name);
                                cacheManager.cleanStorage(10 * 1000);
                            } else {
                                localDep.removeDependence(name);
                                private_me.cleanStorage(10 * 1000);
                            }
                        };

                        me.setDependenceVal = function (name, val, global) {
                            if (global) {
                                globalDep.setDependenceVal(name, val);
                                cacheManager.cleanStorage(5 * 1000);
                            } else {
                                localDep.setDependenceVal(name, val);
                                private_me.cleanStorage(5 * 1000);
                            }
                        };

                        private_me.cleanStorage = function (delay, dep_name) {
                            if (!_localStorage_supported)
                                return;

                            if (angular.isDefined(delay) && angular.isNumber(delay)) {
                                $timeout.cancel(private_me.cleanTimeout);
                                private_me.cleanTimeout = $timeout(private_me.cleanStorage, delay);
                                return 0;
                            }

                            var i, key, count = 0, now = (new Date()).getTime();

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
                        private_me.isBelongs = function (key) {
                            return storageName_regexp.test(key);
                        };
                        private_me.isInvalid = function (key, now) {
                            if (private_me.isBelongs(key)) {
                                return depChecker.isItemInvalid(storage.get(key), now);
                            }
                            return false;
                        };
                        private_me.isCritical = function (key) {
                            return private_me.isBelongs(key) && _options.critical;
                        };
                        private_me.setCleanInterval = function (time) {
                            if (typeof time === "undefined") { time = DEF_CLEAN_INTERVAL; }
                            private_me.cleanIntervalTime = time;
                            $interval.cancel(private_me.cleanInterval);
                            private_me.cleanInterval = $interval(private_me.cleanStorage, time);
                        };
                        private_me.resetCleanInterval = function () {
                            private_me.setCleanInterval(private_me.cleanIntervalTime);
                        };
                        private_me.setCleanInterval(_options.cleanTimeout);

                        cacheManager.registerCacheObject(storageValName, me, private_me);

                        return me;
                    };
                }];
            serviceProvider.setAppName = function (name) {
                provider.name = name;
            };
            serviceProvider.setDefOptions = function (options) {
                provider.defOptions = angular.extend({}, provider.defOptions, options);
            };
        };

        var module = angular.module('speedshifter.localStoragePromise', []);
        module.provider('localStoragePromise', Services.LocalStorageProvider);
    })(SpeedShifter.Services || (SpeedShifter.Services = {}));
    var Services = SpeedShifter.Services;
})(SpeedShifter || (SpeedShifter = {}));
