'use strict';
xdescribe('angular-localStorage-cache ->', function () {
    describe('service ->', function () {
        var localStorage, $timeout, $interval, $window;

        beforeEach(function () {
            angular.module('test', ['speedshifter.localStoragePromise']);
        });

        beforeEach(module('test'));

        beforeEach(inject(function (_localStoragePromise_, _$timeout_, _$window_, _$interval_) {
            localStorage = _localStoragePromise_;
            $timeout = _$timeout_;
            $interval = _$interval_;
            $window = _$window_;
        }));

        it('should create new cache factory', function () {
            expect(localStorage).not.toBeNull();
        });

        describe('localStorage ->', function () {
            var storage, val;
            beforeEach(function () {
                $window.localStorage.clear();
            });

            describe('', function () {
                beforeEach(function () {
                    storage = localStorage("localStorage", {});
                    val = { a: 1, b: 2 };
                });

                it('new storage object should be created', function () {
                    expect(storage).toBeDefined();
                    expect(storage.clear).toBeDefined();
                    expect(storage.get).toBeDefined();
                    expect(storage.set).toBeDefined();
                    expect(storage.setDependence).toBeDefined();
                    expect(storage.setDependenceVal).toBeDefined();
                    expect(storage.setOptions).toBeDefined();
                    expect(storage.clearStorage).toBeDefined();
                    expect(storage.remove).toBeDefined();
                    expect(storage.getLocalStorageKey).toBeDefined();
                });

                it('not setted value, should be undefined', function () {
                    expect(storage.get("val")).toBeNull();
                });

                it('after set, get should return same value', function () {
                    expect(storage.get("val")).toBeNull();
                    expect(storage.set("val", val)).toBeUndefined();
                    expect(storage.get("val")).toEqual(val);

                    expect($window.localStorage.getItem(storage.getLocalStorageKey("val"))).toBeDefined();
                });

                it('hardcore $window.localStorage.clear should remove all items', function () {
                    $window.localStorage.clear();
                    expect($window.localStorage.getItem(storage.getLocalStorageKey("val"))).toBeNull();
                });

                it('remove should remove one item', function () {
                    storage.set("val", val);
                    expect(storage.get("val")).toEqual(val);

                    storage.set("val2", val);
                    expect(storage.get("val2")).toEqual(val);

                    storage.remove("val2");

                    expect(storage.get("val2")).toBeNull();
                    expect($window.localStorage.getItem(storage.getLocalStorageKey("val2"))).toBeNull();
                });

                it('clear should remove bunch of items of specific storage object, other should be unaffected', function () {
                    var storage2 = localStorage("localStorage2", {});

                    storage.set("val", val);
                    storage.set("val2", val);
                    expect(storage.get("val")).toEqual(val);
                    expect(storage.get("val2")).toEqual(val);

                    var val2 = { c: 1, d: 2 }, val3 = 1, val4 = 0;
                    storage2.set("val", val2);
                    storage2.set("val2", val2);
                    storage2.set("val3", val3);
                    storage2.set("val4", val4);
                    expect(storage2.get("val")).toEqual(val2);
                    expect(storage2.get("val2")).toEqual(val2);
                    expect(storage2.get("val3")).toEqual(val3);
                    expect(storage2.get("val4")).toEqual(val4);

                    storage2.clear();

                    expect(storage2.get("val")).toBeNull();
                    expect(storage2.get("val2")).toBeNull();
                    expect(storage2.get("val3")).toBeNull();
                    expect(storage2.get("val4")).toBeNull();

                    expect(storage.get("val")).toEqual(val);
                    expect(storage.get("val2")).toEqual(val);
                });

                it('clearStorage should remove all bunches of items, but don\'t affect other localStorage items', function () {
                    var storage2 = localStorage("localStorage2", {});

                    $window.localStorage.setItem("other item", "other item");

                    storage.set("val", val);
                    storage.set("val2", val);
                    expect(storage.get("val")).toEqual(val);
                    expect(storage.get("val2")).toEqual(val);

                    var val2 = { c: 1, d: 2 }, val3 = 1, val4 = 0;
                    storage2.set("val", val2);
                    storage2.set("val2", val2);
                    storage2.set("val3", val3);
                    storage2.set("val4", val4);
                    expect(storage2.get("val")).toEqual(val2);
                    expect(storage2.get("val2")).toEqual(val2);
                    expect(storage2.get("val3")).toEqual(val3);
                    expect(storage2.get("val4")).toEqual(val4);

                    storage2.clearStorage();

                    expect(storage2.get("val")).toBeNull();
                    expect(storage2.get("val2")).toBeNull();
                    expect(storage2.get("val3")).toBeNull();
                    expect(storage2.get("val4")).toBeNull();

                    expect(storage.get("val")).toBeNull();
                    expect(storage.get("val2")).toBeNull();

                    expect($window.localStorage.getItem("other item")).toEqual("other item");
                });

                it('storage with same name is same storage', function () {
                    var storage2 = localStorage("localStorage", {});

                    expect(storage2).toBe(storage);
                });
            });

            describe('dependency ->', function () {
                var userId = "12345", version = "1.0";
                beforeEach(function () {
                    storage = localStorage("localStorage", {
                        dependent: ["userId", "version"]
                    });
                    val = { a: 1, b: 2 };
                });

                it('if dependency values don\'t set, get should return null', function () {
                    expect(storage.get("val")).toBeNull();
                    storage.set("val", val);
                    expect(storage.get("val")).toBeNull();
                });

                describe('local ->', function () {
                    beforeEach(function () {
                        storage.setDependence({
                            name: "userId",
                            value: userId
                        });
                        storage.setDependence({
                            name: "version",
                            value: version
                        });
                    });
                    it('when deps are set, storage should work as normal', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);
                    });

                    it('when any dep is changed, values depend on it should be failed', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.setDependence({
                            name: "version",
                            value: "2.0"
                        });

                        expect(storage.get("val")).toBeNull();
                    });

                    it('setDependenceVal should behave same as setDependence', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.setDependenceVal("version", "2.0");

                        expect(storage.get("val")).toBeNull();

                        storage.setDependenceVal("version", version);

                        expect(storage.get("val")).toBeNull();

                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.setDependenceVal("version", "2.0");
                        storage.setDependenceVal("version", version);

                        expect(storage.get("val")).toEqual(val);
                    });

                    it('removeDependence should remove dependency', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.removeDependence("version", true);

                        expect(storage.get("val")).toEqual(val);

                        storage.removeDependence("version");

                        expect(storage.get("val")).toBeNull();
                    });
                });

                describe('global ->', function () {
                    beforeEach(function () {
                        storage.setDependence({
                            name: "userId",
                            value: userId
                        }, true);
                        storage.setDependence({
                            name: "version",
                            value: version
                        }, true);
                    });
                    it('when deps are set, storage should work as normal', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);
                    });

                    it('when any dep is changed, values depend on it should be failed', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.setDependence({
                            name: "version",
                            value: "2.0"
                        }, true);

                        expect(storage.get("val")).toBeNull();
                    });

                    it('removeDependence should remove dependency', function () {
                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.removeDependence("version");

                        expect(storage.get("val")).toEqual(val);

                        storage.removeDependence("version", true);

                        expect(storage.get("val")).toBeNull();
                    });
                });

                describe('global/local ->', function () {
                    it('should fail, when local dep is undefined', function () {
                        storage.setDependence({
                            name: "userId",
                            value: userId
                        }, true);

                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toBeNull();
                    });

                    it('global+local should work as normal', function () {
                        storage.setDependence({
                            name: "userId",
                            value: userId
                        }, true);
                        storage.setDependence({
                            name: "version",
                            value: version
                        });

                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);
                    });

                    it('should fail, when local dep is undefined', function () {
                        storage.setDependence({
                            name: "userId",
                            value: userId
                        });
                        storage.setDependence({
                            name: "version",
                            value: { a: 1, b: 2, c: 3 }
                        });

                        expect(storage.get("val")).toBeNull();
                        storage.set("val", val);
                        expect(storage.get("val")).toEqual(val);

                        storage.setDependence({
                            name: "version",
                            value: { a: 4, b: 1, c: 1 },
                            comparator: function (a, b) {
                                return a.a + a.b + a.c == b.a + b.b + b.c;
                            }
                        });

                        expect(storage.get("val")).toEqual(val);
                    });

                    describe('mixed ->', function () {
                        beforeEach(function () {
                            storage.setDependence({
                                name: "userId",
                                value: userId
                            }, true);
                            storage.setDependence({
                                name: "version",
                                value: version
                            });
                        });

                        it('second storage should inherit global dependency', function () {
                            var storage2 = localStorage("localStorage2", {
                                dependent: ["userId"]
                            });

                            expect(storage2.get("val")).toBeNull();
                            storage2.set("val", val);
                            expect(storage2.get("val")).toEqual(val);
                        });

                        it('second storage should inherit global dependency, but not local', function () {
                            var storage2 = localStorage("localStorage2", {
                                dependent: ["userId", "version"]
                            });

                            expect(storage2.get("val")).toBeNull();
                            storage2.set("val", val);
                            expect(storage2.get("val")).toBeNull();
                        });

                        it('storage with same name is same', function () {
                            var storage2 = localStorage("localStorage", {
                                dependent: ["userId", "version"]
                            });

                            expect(storage2).toBe(storage);

                            expect(storage2.get("val")).toBeNull();
                            storage2.set("val", val);
                            expect(storage2.get("val")).toEqual(val);
                        });

                        it('changing local dep shouldn\'t affect other storages', function () {
                            var storage2 = localStorage("localStorage2", {
                                dependent: ["userId", "version"]
                            });

                            var version2 = "2.0";
                            storage2.setDependence({
                                name: "version",
                                value: version2
                            }, true);

                            storage2.set("val", val);
                            expect(storage2.get("val")).toEqual(val);

                            storage.set("val", val);
                            expect(storage.get("val")).toEqual(val);

                            storage.setDependence({
                                name: "version",
                                value: version2
                            });

                            expect(storage.get("val")).toBeNull();
                            expect(storage2.get("val")).toEqual(val);
                        });

                        it('changing global dep should affect only storages, that doesn\'t have local copies', function () {
                            var storage2 = localStorage("localStorage2", {
                                dependent: ["userId", "version"]
                            });

                            var version2 = "2.0";
                            storage2.setDependence({
                                name: "version",
                                value: version2
                            }, true);

                            storage2.set("val", val);
                            expect(storage2.get("val")).toEqual(val);

                            storage.set("val", val);
                            expect(storage.get("val")).toEqual(val);

                            storage2.setDependence({
                                name: "version",
                                value: version
                            }, true);

                            expect(storage.get("val")).toEqual(val);
                            expect(storage2.get("val")).toBeNull();

                            storage.setDependence({
                                name: "version",
                                value: version2
                            });

                            expect(storage.get("val")).toBeNull();
                        });

                        it('multiple storages', function () {
                            expect($window.localStorage.length).toBe(0);

                            storage.setDependence({
                                name: "version",
                                value: version
                            }, true);

                            var storage2 = localStorage("localStorage2", {
                                dependent: ["userId", "version"]
                            }), val2 = { a: 2, b: val };
                            var storage3 = localStorage("localStorage3", {
                                dependent: ["userId", "version", "a"]
                            }), val3 = [1, 2, 3], val3_1 = [val2, val3];

                            storage2.setDependence({
                                name: "version",
                                value: "2.0"
                            });
                            storage3.setDependence({
                                name: "a",
                                value: [1, 2]
                            });

                            storage.set("val", val);
                            storage2.set("val", val2);
                            storage3.set("val", val3);
                            storage3.set("val_1", val3_1);
                            storage3.set("val_2", val3_1);

                            expect(storage.get("val")).toEqual(val);
                            expect(storage2.get("val")).toEqual(val2);
                            expect(storage3.get("val")).toEqual(val3);
                            expect(storage3.get("val_1")).toEqual(val3_1);
                            expect(storage3.get("val_2")).toEqual(val3_1);

                            expect($window.localStorage.length).toBe(5);
                        });

                        it('removeDependence should remove dependency', function () {
                            expect(storage.get("val")).toBeNull();
                            storage.set("val", val);
                            expect(storage.get("val")).toEqual(val);

                            storage.setDependence({
                                name: "version",
                                value: "2.0"
                            }, true);

                            expect(storage.get("val")).toEqual(val);

                            storage.removeDependence("version");

                            storage.set("val2", val);

                            expect(storage.get("val")).toBeNull();

                            storage.setDependence({
                                name: "version",
                                value: version
                            });

                            expect(storage.get("val2")).toBeNull();
                        });
                    });
                });
            });

            describe('expiration ->', function () {
                beforeEach(function () {
                    storage = localStorage("localStorage", {
                        expires: 10 * 1000,
                        cleanTimeout: 20 * 1000
                    });
                    val = { a: 1, b: 2 };
                });

                beforeEach(function () {
                    jasmine.clock().install();
                });
                afterEach(function () {
                    jasmine.clock().uninstall();
                });
                beforeEach(function () {
                    spyOn(Date.prototype, 'getTime').and.returnValue(0);
                });
                var setTime = function (time) {
                    jasmine.clock().tick(time);
                    Date.prototype.getTime['and'].returnValue(time);
                };

                beforeEach(function () {
                    setTime(1000);
                });

                it('value should expire', function () {
                    expect(storage.get("val")).toBeNull();
                    storage.set("val", val);
                    expect(storage.get("val")).toEqual(val);

                    setTime(5 * 1000);

                    expect(storage.get("val")).toEqual(val);

                    setTime(15 * 1000);

                    expect(storage.get("val")).toBeNull();
                });
                it('storage should be cleaned', function () {
                    expect(storage.get("val")).toBeNull();
                    storage.set("val", val);
                    storage.set("val2", val);
                    storage.set("val3", val);

                    $window.localStorage.setItem("other Item", "other");

                    expect(storage.get("val")).toEqual(val);

                    setTime(5 * 1000);

                    expect(storage.get("val")).toEqual(val);

                    setTime(15 * 1000);

                    expect($window.localStorage.length).toBe(4);

                    setTime(21 * 1000);
                    $timeout.flush();

                    expect($window.localStorage.length).toBe(1);
                });
            });
        });
    });
});
