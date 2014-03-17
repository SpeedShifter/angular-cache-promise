var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        var LocalStorageHelpers = (function () {
            function LocalStorageHelpers() {
            }
            LocalStorageHelpers.compare = function (dep, val) {
                return dep && ((dep.comparator && dep.comparator(dep.value, val)) || (dep.value === val));
            };
            LocalStorageHelpers.getDepend = function (name, depStorages) {
                for (var i = 0; depStorages && i < depStorages.length; i++) {
                    if (depStorages[i][name]) {
                        return depStorages[i][name];
                    }
                }
                return undefined;
            };
            LocalStorageHelpers.isDependentFailed = function (vals, deps, depStorages) {
                if (!vals)
                    return true;

                var i, name, depend;

                if (deps && deps.length > 0) {
                    for (i = 0; i < deps.length; i++) {
                        depend = LocalStorageHelpers.getDepend(deps[i], depStorages);
                        if ((depend && !LocalStorageHelpers.compare(depend, vals[deps[i]])) || (!depend && angular.isDefined(vals[deps[i]]))) {
                            return true;
                        }
                    }
                }
                return false;
            };
            LocalStorageHelpers.isItemOutdated = function (item, options, now) {
                if (typeof now === "undefined") { now = (new Date()).getTime(); }
                if (!item || !options || (options.expires && !(item.time && item.time + options.expires > now))) {
                    return true;
                }
                return false;
            };
            LocalStorageHelpers.isItemInvalid = function (item, options, depStorages, now) {
                if (typeof now === "undefined") { now = (new Date()).getTime(); }
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
                return undefined;
            };
            return LocalStorageHelpers;
        })();
        Services.LocalStorageHelpers = LocalStorageHelpers;

        Services.LocalStorageProvider = function () {
            var provider = this, serviceProvider = this, ITEMS_NAME_DELIMITER = ".", ITEMS_NAME_DELIMITER_REG_SAFE = "\\.", DEF_CLEAN_INTERVAL = 5 * 60 * 1000;

            provider.name = '';
            provider.defOptions = {};

            this.$get = [
                '$log', '$window', '$interval', function ($log, $window, $interval) {
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
                    cacheManager.cleanStorage = function () {
                        if (!_localStorage_supported)
                            return;

                        var i, key, j, stack = cacheManager.cacheStack, count = 0, now = (new Date()).getTime();
                        for (i = 0; i < _localStorage.length; i++) {
                            key = _localStorage.key(i);
                            for (j in stack) {
                                try  {
                                    if (stack[j].private_cache.isInvalid(key, now)) {
                                        storage.remove(key);
                                        count++;
                                        break;
                                    }
                                } catch (e) {
                                }
                            }
                        }
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
                                        count++;
                                        break;
                                    }
                                } catch (e) {
                                }
                            }
                        }
                        return count;
                    };
                    cacheManager.setClearInterval = function (time) {
                        if (typeof time === "undefined") { time = DEF_CLEAN_INTERVAL; }
                        $interval.cancel(cacheManager.clearInterval);
                        cacheManager.clearInterval = $interval(cacheManager.cleanStorage, time);
                    };
                    cacheManager.setClearInterval(provider.defOptions.cleanTimeout);
                    setTimeout(cacheManager.cleanStorage, 10 * 1000);

                    if (!_localStorage_supported) {
                        $log.error('LocalStorage is not supported');
                    }

                    return function (cacheId, options) {
                        var storageValName = provider.name + ITEMS_NAME_DELIMITER + cacheId;
                        if (cacheManager.getCacheObject(storageValName)) {
                            $log.log(cacheId + " localStorage already exists.");
                            return cacheManager.getCacheObject(storageValName);
                        }

                        options = angular.extend({}, provider.defOptions, options);
                        var storageName_regexp = new RegExp("^" + storageValName + ITEMS_NAME_DELIMITER_REG_SAFE, "gi");

                        var me = {}, localDep = {}, allDep = [localDep, globalDep], private_me = {};

                        me.get = function (valName) {
                            var propertyName = storageValName + ITEMS_NAME_DELIMITER + valName, item = storage.get(propertyName);
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

                        me.set = function (valName, val) {
                            var propertyName = storageValName + ITEMS_NAME_DELIMITER + valName, item = {
                                data: val,
                                time: (new Date()).getTime(),
                                depends: LocalStorageHelpers.composeDeps(options.dependent, allDep)
                            };
                            try  {
                                storage.set(propertyName, item);
                            } catch (e) {
                                $log.log("localStorage LIMIT REACHED: (" + e + ")");
                                setTimeout(cacheManager.cleanOnStorageOverflow, 0);
                            }
                        };

                        me.remove = function (valName) {
                            var propertyName = storageValName + ITEMS_NAME_DELIMITER + valName;
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
                                }
                            }
                        };

                        me.clearStorage = function () {
                            cacheManager.clearStorage();
                        };

                        me.setDependence = function (dep, global) {
                            if (global) {
                                globalDep[dep.name] = dep;
                                cacheManager.cleanStorage();
                            } else {
                                localDep[dep.name] = dep;
                                private_me.cleanStorage();
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
                                cacheManager.cleanStorage();
                            } else {
                                if (localDep[name])
                                    localDep[name].value = val;
                                else
                                    localDep[name] = {
                                        name: name,
                                        value: val
                                    };
                                private_me.cleanStorage();
                            }
                        };

                        private_me.cleanStorage = function (dep_name) {
                            if (!_localStorage_supported)
                                return;

                            console.error("cleanStorage", cacheId);

                            var i, key, count = 0, now = (new Date()).getTime();
                            for (i = 0; i < _localStorage.length; i++) {
                                key = _localStorage.key(i);
                                if (private_me.isInvalid(key, now)) {
                                    storage.remove(key);
                                }
                            }
                            return count;
                        };
                        private_me.isBelongs = function (key) {
                            return storageName_regexp.test(key);
                        };
                        private_me.isInvalid = function (key, now) {
                            if (typeof now === "undefined") { now = (new Date()).getTime(); }
                            if (private_me.isBelongs(key)) {
                                return LocalStorageHelpers.isItemInvalid(storage.get(key), options, allDep, now);
                            }
                            return false;
                        };
                        private_me.isCritical = function (key) {
                            return private_me.isBelongs(key) && options.critical;
                        };
                        private_me.setClearInterval = function (time) {
                            if (typeof time === "undefined") { time = DEF_CLEAN_INTERVAL; }
                            $interval.cancel(private_me.clearInterval);
                            if (time != provider.defOptions.cleanTimeout) {
                                private_me.clearInterval = $interval(private_me.cleanStorage, time);
                            }
                        };
                        private_me.setClearInterval(options.cleanTimeout);

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
