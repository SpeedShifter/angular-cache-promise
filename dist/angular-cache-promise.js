var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        'use strict';

        Services.CachePromiseProvider = function () {
            var serviceProvider = this, defOptions = {}, cacheStore = {};

            this.$get = [
                '$q', '$cacheFactory', function ($q, $cacheFactory) {
                    var ngDefResolver = function (values, failed) {
                        var def = $q.defer();
                        (!failed ? def.resolve : def.reject).apply(this, values);
                        return def.promise;
                    }, $DefResolver = function (values, failed) {
                        var def = $.Deferred();
                        (!failed ? def.resolve : def.reject).apply(this, values);
                        return def.promise();
                    };

                    return function (cacheId, options) {
                        if (cacheStore[cacheId])
                            return cacheStore[cacheId];

                        var me = cacheStore[cacheId] = {}, opt, cache = $cacheFactory(cacheId, options);

                        me.setOptions = function (_options) {
                            opt = angular.extend({}, defOptions, _options);

                            if (!opt.defResolver || !angular.isFunction(opt.defResolver)) {
                                if (opt.JQPromise)
                                    opt.defResolver = $DefResolver;
                                else
                                    opt.defResolver = ngDefResolver;
                            }
                        };
                        me.setOptions(options);

                        me.get = function (key, timeout) {
                            var cached = cache.get(key), now = (new Date()).getTime();
                            if (cached && cached.promise) {
                                return cached.promise;
                            }
                            if (cached) {
                                if ((!timeout || (now - cached.time < timeout)) && (!opt.timeout || (now - cached.time < opt.timeout))) {
                                    return opt.defResolver(cached.data, cached.failed);
                                } else
                                    cache.remove(key);
                            }
                            return null;
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
                            }, fail_fnc = opt.saveFail ? function () {
                                var values = [];
                                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                                    values[_i] = arguments[_i + 0];
                                }
                                cached_obj.failed = true;
                                cached_obj.data = values;
                                cached_obj.time = (new Date()).getTime();
                                delete cached_obj.promise;
                                if (opt.dontSaveResult || opt.timeout === 0) {
                                    cache.remove(key);
                                }
                            } : function () {
                                delete cached_obj.promise;
                                cache.remove(key);
                            };
                            promise.then(fnc, fail_fnc);

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
