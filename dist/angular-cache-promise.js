var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        'use strict';

        Services.CachePromiseProvider = [function () {
                var serviceProvider = this, defOptions = {
                    capacity: null,
                    timeout: null,
                    saveFail: false,
                    defResolver: null,
                    JQPromise: false
                };

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
                            var me = {}, opt = angular.extend({}, defOptions, options), cache = $cacheFactory(cacheId, options);

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
                                if (cached && (!timeout || (now - cached.time < timeout)) && (!opt.timeout || (now - cached.time < opt.timeout))) {
                                    return opt.defResolver.apply(cached.context || this, cached.data);
                                }
                                return null;
                            };
                            me.set = function (key, promise, context) {
                                var cached_obj = {
                                    context: context,
                                    promise: promise
                                };

                                var fnc = function () {
                                    cached_obj.data = Array.prototype.slice.call(arguments);
                                    cached_obj.time = (new Date()).getTime();
                                    delete cached_obj.promise;
                                };
                                promise.then(fnc, opt.saveFail && fnc);

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
            }];
    })(SpeedShifter.Services || (SpeedShifter.Services = {}));
    var Services = SpeedShifter.Services;
})(SpeedShifter || (SpeedShifter = {}));

var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        var module = angular.module('speedshifter.cachePromise') || angular.module('speedshifter.cachePromise', []);
        module.provider('cachePromise', SpeedShifter.Services.CachePromiseProvider);
    })(SpeedShifter.Services || (SpeedShifter.Services = {}));
    var Services = SpeedShifter.Services;
})(SpeedShifter || (SpeedShifter = {}));
