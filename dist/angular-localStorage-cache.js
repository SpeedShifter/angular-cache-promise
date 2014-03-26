var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        var LocalStorageHelpers = (function () {
            function LocalStorageHelpers() {
            }
            LocalStorageHelpers.compare = function (dep, val) {
                return dep && ((dep.comparator && dep.comparator(dep.value, val)) || (dep.value === val) || (angular.isObject(dep.value) && angular.equals(dep.value, val)));
            };
            LocalStorageHelpers.getDepend = function (name, depStorages) {
                for (var i = 0; depStorages && i < depStorages.length; i++) {
                    if (depStorages[i][name]) {
                        return depStorages[i][name];
                    }
                }
                return null;
            };
            LocalStorageHelpers.isDependentFailed = function (vals, deps, depStorages) {
                if (!vals)
                    return true;

                var i, name, depend;

                if (deps && deps.length > 0) {
                    for (i = 0; i < deps.length; i++) {
                        depend = LocalStorageHelpers.getDepend(deps[i], depStorages);
                        if (!depend || angular.isUndefined(vals[deps[i]]) || (depend && !LocalStorageHelpers.compare(depend, vals[deps[i]]))) {
                            return true;
                        }
                    }
                }
                return false;
            };
            LocalStorageHelpers.isItemOutdated = function (item, options, now) {
                if (typeof now === "undefined") { now = (new Date()).getTime(); }
                if (item && !options)
                    return false;

                if (!item || !options || (options.expires && !(angular.isDefined(item.time) && (now - item.time < options.expires)))) {
                    return true;
                }
                return false;
            };
            LocalStorageHelpers.isItemInvalid = function (item, options, depStorages, now) {
                if (typeof now === "undefined") { now = (new Date()).getTime(); }
                if (item && !options)
                    return false;
                if (!item || !options || !depStorages || LocalStorageHelpers.isItemOutdated(item, options, now) || (options.dependent && LocalStorageHelpers.isDependentFailed(item.depends, options.dependent, depStorages))) {
                    return true;
                }
                return false;
            };
            LocalStorageHelpers.composeDeps = function (dep, depStorages) {
                if (dep && dep.length > 0) {
                    var deps = {}, i, depend, c = 0;
                    for (i = 0; i < dep.length; i++) {
                        depend = LocalStorageHelpers.getDepend(dep[i], depStorages);
                        if (depend) {
                            deps[dep[i]] = depend.value;
                            c++;
                        }
                    }
                    if (c > 0)
                        return deps;
                }
                return null;
            };
            return LocalStorageHelpers;
        })();
        Services.LocalStorageHelpers = LocalStorageHelpers;

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
                    }, globalDep = {};

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
                            var i, key, j, stack = cacheManager.cacheStack, count = 0;
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

                        var me = {}, localDep = {}, allDep = [localDep, globalDep], private_me = {}, storageName_regexp = new RegExp("^" + storageValName + ITEMS_NAME_DELIMITER_REG_SAFE + ".*", "i"), _options;

                        me.setOptions = function (_options_) {
                            _options = angular.extend({}, provider.defOptions, _options_);
                        };
                        me.setOptions(options);

                        me.getLocalStorageKey = function (valName) {
                            return storageValName + ITEMS_NAME_DELIMITER + (valName || '');
                        };

                        me.get = function (valName) {
                            var propertyName = me.getLocalStorageKey(valName), item = storage.get(propertyName);
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

                        me.set = function (valName, val) {
                            var propertyName = me.getLocalStorageKey(valName), item = {
                                data: val,
                                time: (new Date()).getTime(),
                                depends: LocalStorageHelpers.composeDeps(_options.dependent, allDep)
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
                                globalDep[dep.name] = dep;
                                cacheManager.cleanStorage(5 * 1000);
                            } else {
                                localDep[dep.name] = dep;
                                private_me.cleanStorage(5 * 1000);
                            }
                        };

                        me.removeDependence = function (name, global) {
                            if (global) {
                                delete globalDep[name];
                                cacheManager.cleanStorage(10 * 1000);
                            } else {
                                delete localDep[name];
                                private_me.cleanStorage(10 * 1000);
                            }
                        };

                        me.setDependenceVal = function (name, val, global) {
                            if (global) {
                                if (globalDep[name])
                                    globalDep[name].value = val;
                                else
                                    globalDep[name] = {
                                        name: name,
                                        value: val
                                    };
                                cacheManager.cleanStorage(5 * 1000);
                            } else {
                                if (localDep[name])
                                    localDep[name].value = val;
                                else
                                    localDep[name] = {
                                        name: name,
                                        value: val
                                    };
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
                            if (typeof now === "undefined") { now = (new Date()).getTime(); }
                            if (private_me.isBelongs(key)) {
                                return LocalStorageHelpers.isItemInvalid(storage.get(key), _options, allDep, now);
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
//# sourceMappingURL=angular-localStorage-cache.js.map
