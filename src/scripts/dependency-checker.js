var SpeedShifter;
(function (SpeedShifter) {
    (function (Services) {
        var DepStorage = (function () {
            function DepStorage() {
                var globals = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    globals[_i] = arguments[_i + 0];
                }
                this.storage = {};
                this.global = globals;
            }
            DepStorage.prototype.setGlobals = function () {
                var globals = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    globals[_i] = arguments[_i + 0];
                }
                this.global = globals;
            };
            DepStorage.prototype.addGlobals = function () {
                var globals = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    globals[_i] = arguments[_i + 0];
                }
                return this.global = (this.global || []).concat(globals);
            };
            DepStorage.prototype.getGlobals = function () {
                return this.global;
            };
            DepStorage.prototype.getDepend = function (name) {
                if (this.storage[name])
                    return this.storage[name];

                if (this.global && this.global.length > 0) {
                    var global = this.global, i, dep;
                    for (i = global.length - 1; i >= 0; i--) {
                        dep = global[i].getDepend(name);
                        if (dep)
                            return dep;
                    }
                }
                return null;
            };

            DepStorage.prototype.isDependentFailed = function (vals, deps) {
                if (!deps)
                    return false;
                if (!vals)
                    return true;

                var i, name, depend;

                for (i = 0; i < deps.length; i++) {
                    depend = this.getDepend(deps[i]);
                    if (!depend || angular.isUndefined(vals[deps[i]]) || (depend && !DepStorage.compare(depend, vals[deps[i]]))) {
                        return true;
                    }
                }
                return false;
            };

            DepStorage.prototype.composeDeps = function (dep) {
                if (dep && dep.length > 0) {
                    var deps = {}, i, depend, c = 0;
                    for (i = 0; i < dep.length; i++) {
                        depend = this.getDepend(deps[i]);
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

            DepStorage.prototype.setDependence = function (dep) {
                this.storage[dep.name] = dep;
            };

            DepStorage.prototype.removeDependence = function (name) {
                delete this.storage[name];
            };

            DepStorage.prototype.clear = function () {
                delete this.storage;
                this.storage = {};
            };

            DepStorage.prototype.setDependenceVal = function (name, val) {
                if (this.storage[name])
                    this.storage[name].value = val;
                else
                    this.storage[name] = {
                        name: name,
                        value: val
                    };
            };

            DepStorage.compare = function (dep, val) {
                return dep && ((dep.comparator && dep.comparator(dep.value, val)) || (dep.value === val) || (angular.isObject(dep.value) && angular.equals(dep.value, val)));
            };
            return DepStorage;
        })();
        Services.DepStorage = DepStorage;

        var ExpirationChecker = (function () {
            function ExpirationChecker() {
            }
            ExpirationChecker.isItemOutdated = function (time, expires, now) {
                if (typeof now === "undefined") { now = (new Date()).getTime(); }
                if (!expires)
                    return false;

                if (!time || (expires && !(angular.isDefined(time) && (now - time < expires)))) {
                    return true;
                }
                return false;
            };
            ExpirationChecker.now = function () {
                return (new Date()).getTime();
            };
            return ExpirationChecker;
        })();
        Services.ExpirationChecker = ExpirationChecker;

        var DepChecker = (function () {
            function DepChecker(options, depStorage) {
                this.options = options;
                this.depStorage = depStorage;
            }
            DepChecker.isItemInvalid = function (item, options, depStorage, now) {
                if (!options)
                    return false;

                if (!item || ExpirationChecker.isItemOutdated(item.time, options.expires, now) || (options.dependent && !depStorage) || (depStorage && depStorage.isDependentFailed(item.depends, options.dependent))) {
                    return true;
                }
                return false;
            };

            DepChecker.prototype.isItemInvalid = function (item, now) {
                return DepChecker.isItemInvalid(item, this.options, this.depStorage, now);
            };
            DepChecker.prototype.setOptions = function (options) {
                this.options = options;
            };
            DepChecker.prototype.setDepStorage = function (depStorage) {
                this.depStorage = depStorage;
            };
            return DepChecker;
        })();
        Services.DepChecker = DepChecker;
    })(SpeedShifter.Services || (SpeedShifter.Services = {}));
    var Services = SpeedShifter.Services;
})(SpeedShifter || (SpeedShifter = {}));
