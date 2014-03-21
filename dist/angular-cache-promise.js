var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        'use strict';

        Services.CachePromiseProvider = function () {
            var serviceProvider = this, defOptions = {
                capacity: null,
                timeout: null,
                saveFail: false,
                dontSaveResult: false,
                defResolver: null,
                JQPromise: false
            }, cacheStore = {};

            this.$get = [
                '$q', '$cacheFactory', function ($q, $cacheFactory) {
                    var ngDefResolver = function () {
                        var values = [];
                        for (var _i = 0; _i < (arguments.length - 0); _i++) {
                            values[_i] = arguments[_i + 0];
                        }
                        var def = $q.defer();
                        def.resolve.apply(this, values);
                        return def.promise;
                    }, $DefResolver = function () {
                        var values = [];
                        for (var _i = 0; _i < (arguments.length - 0); _i++) {
                            values[_i] = arguments[_i + 0];
                        }
                        var def = $.Deferred();
                        def.resolve.apply(this, values);
                        return def.promise();
                    };

                    return function (cacheId, options) {
                        if (cacheStore[cacheId])
                            return cacheStore[cacheId];

                        var me = cacheStore[cacheId] = {}, opt = angular.extend({}, defOptions, options), cache = $cacheFactory(cacheId, options);

                        if (!opt.defResolver || !angular.isFunction(opt.defResolver)) {
                            if (opt.JQPromise)
                                opt.defResolver = $DefResolver;
                            else
                                opt.defResolver = ngDefResolver;
                        }

                        me.get = function (key, timeout) {
                            var cached = cache.get(key), now = (new Date()).getTime();
                            if (cached && cached.promise) {
                                return cached.promise;
                            }
                            if (cached) {
                                if ((!timeout || (now - cached.time < timeout)) && (!opt.timeout || (now - cached.time < opt.timeout))) {
                                    return opt.defResolver.apply(this, cached.data);
                                } else
                                    cache.remove(key);
                            }
                            return undefined;
                        };
                        me.set = function (key, promise) {
                            var cached_obj = {
                                promise: promise
                            };

                            var fnc = function () {
                                var values = [];
                                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                                    values[_i] = arguments[_i + 0];
                                }
                                cached_obj.data = values;
                                cached_obj.time = (new Date()).getTime();
                                delete cached_obj.promise;
                                if (opt.dontSaveResult || opt.timeout === 0) {
                                    cache.remove(key);
                                }
                            };
                            promise.then(fnc, opt.saveFail ? fnc : function () {
                                delete cached_obj.promise;
                                cache.remove(key);
                            });

                            cache.put(key, cached_obj);
                            return promise;
                        };

                        me.remove = function (key) {
                            cache.remove(key);
                        };
                        me.removeAll = function () {
                            cache.removeAll();
                        };

                        return me;
                    };
                }];

            serviceProvider.setOptions = function (options) {
                return defOptions = angular.extend({}, defOptions, options);
            };
        };

        var module = angular.module('speedshifter.cachePromise', []);
        module.provider('cachePromise', Services.CachePromiseProvider);
    })(SpeedShifter.Services || (SpeedShifter.Services = {}));
    var Services = SpeedShifter.Services;
})(SpeedShifter || (SpeedShifter = {}));
//# sourceMappingURL=angular-cache-promise.js.map
