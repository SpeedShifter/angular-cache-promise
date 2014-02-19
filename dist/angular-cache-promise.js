/// <reference path="./inc.d.ts" />
var App;
(function (App) {
    (function (Services) {
        Services.CachePromiseProvider = [
            "$q", function ($q) {
                var provider = this, serviceProvider = this, ngDefResolver = function () {
                    var values = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        values[_i] = arguments[_i + 0];
                    }
                    var def = $q.defer();
                    def.resolve.apply(this, arguments);
                    return def.promise;
                }, $DefResolver = function () {
                    var values = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        values[_i] = arguments[_i + 0];
                    }
                    var def = $.Deferred();
                    def.resolve.apply(this, arguments);
                    return def.promise();
                }, defOptions = {
                    capacity: null,
                    timeout: null,
                    saveFail: false,
                    defResolver: ngDefResolver
                };

                this.$get = [
                    '$cacheFactory', function ($cacheFactory) {
                        return function (cacheId, options) {
                            var me = {}, opt = angular.extend({}, defOptions, options), cache = $cacheFactory(cacheId, options);

                            me.get = function (key, timeout) {
                                var cached = cache.get(key), now = (new Date()).getTime();
                                if (cached && cached.promise) {
                                    return cached.promise;
                                }
                                if (cached && (!timeout || (now - cached.time < timeout)) && (!opt.timeout || (now - cached.time < opt.timeout))) {
                                    opt.defResolver.apply(cached.context || this, cached.data);
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
                serviceProvider.setDefResolver = function (resolver) {
                    if (resolver && angular.isFunction(resolver)) {
                        defOptions.defResolver = resolver;
                    }
                };
                serviceProvider.useAngularDefResolver = function () {
                    defOptions.defResolver = ngDefResolver;
                };
                serviceProvider.useJQueryDefResolver = function () {
                    defOptions.defResolver = $DefResolver;
                };
            }];
    })(App.Services || (App.Services = {}));
    var Services = App.Services;
})(App || (App = {}));
