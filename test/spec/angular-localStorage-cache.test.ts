/// <reference path="../inc.d.ts" />

'use strict';

describe('angular-localStorage-cache:', function(){
	describe('LocalStorageHelpers:', function(){
		var globalDepStorage = <{[name:string]: SpeedShifter.Services.ILocalStorageDepend}>{
			"userId": {name: "userId", value: "134589"},
			"version": {name: "version", value: {version: "1.0", array: [1, 2, 3]}},
			"dev": {name: "dev", value: "dev global"},
			"compare": {name: "compare", value: {a: 1, b: 2, c: 3}, comparator: function(a, b) {
				return a.a + a.b + a.c == b.a + b.b + b.c;
			}}
		};
		var depStorage = <{[name:string]: SpeedShifter.Services.ILocalStorageDepend}>{
			"dev": {name: "dev", value: "development"}
		};

		it('getDepend', function(){
			expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("userId", [depStorage, globalDepStorage]))
				.toEqual(globalDepStorage["userId"]);
			expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("dev", [depStorage, globalDepStorage]))
				.toEqual(depStorage["dev"]);
			expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("dev", [depStorage, globalDepStorage]))
				.not.toEqual(globalDepStorage["dev"]);
			expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("version", [depStorage, depStorage, depStorage, depStorage, globalDepStorage]))
				.toEqual(globalDepStorage["version"]);
			expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("a", [depStorage, globalDepStorage]))
				.toBeNull();
		});

		it('compare', function(){
			expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["userId"], globalDepStorage["userId"].value))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["userId"], "other val"))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["userId"], null))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["compare"], globalDepStorage["compare"].value))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["compare"], {a: 4, b: 0, c: 2}))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["compare"], {a: 4, b: 1, c: 2}))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare({name: "c", value: {a: 1, b: 2, c: [1, 2, 3]}}, {a: 1, b: 2, c: [1, 2, 3]}))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.compare({name: "c", value: {a: 1, b: 2, c: [1, 2]}}, {a: 1, b: 2, c: [1, 2, 3]}))
				.toBe(false);
		});

		it('isDependentFailed', function(){
			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({ // not failed, value has more props, then necessary
				userId: globalDepStorage["userId"].value,
				dev: depStorage["dev"].value
			}, ["userId"], [depStorage, globalDepStorage]))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({
				userId: globalDepStorage["userId"].value,
				dev: depStorage["dev"].value
			}, ["userId", "dev"], [depStorage, globalDepStorage]))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({  // failed, value has less props, then necessary
				userId: globalDepStorage["userId"].value,
				dev: depStorage["dev"].value
			}, ["userId", "dev", "version"], [depStorage, globalDepStorage]))
				.toBe(true);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({}, [], [depStorage, globalDepStorage]))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({}, [], []))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({}, null, null))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({}, undefined, undefined))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({}, ["a"], [depStorage, globalDepStorage]))
				.toBe(true); // dep "a" is required, but not defined in current val

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({"a": 1}, ["a"], [depStorage, globalDepStorage]))
				.toBe(true); // dep "a" doens't defined in depStorages

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({}, ["userId"], [depStorage, globalDepStorage]))
				.toBe(true);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed(
				SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev"], [depStorage, globalDepStorage])
				, ["userId", "dev"], [depStorage, globalDepStorage]))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed(null
				, ["userId", "dev"], [depStorage, globalDepStorage]))
				.toBe(true);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed(undefined
				, ["userId", "dev"], [depStorage, globalDepStorage]))
				.toBe(true);

		});

		it('isItemOutdated', function(){
			var now = (new Date()).getTime();
			var depOptions = <SpeedShifter.Services.ILocalStorageOptions> {
				expires: 20*1000
			};

			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({time: now}, depOptions))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({time: now - depOptions.expires + 10}, depOptions))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({time: now - depOptions.expires - 10}, depOptions))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({time: now - depOptions.expires + 10}, depOptions, now))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({time: now}, null))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({time: now}, {}))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({}, {}))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated({}, depOptions))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemOutdated(null, depOptions))
				.toBe(true);
		});

		it('isItemInvalid', function(){
			var now = (new Date()).getTime();
			var depOptions = <SpeedShifter.Services.ILocalStorageOptions> {
				expires: 20*1000,
				dependent: ["userId", "dev"]
			};
			var value = <SpeedShifter.Services.ILocalStorageItemWrapper>{
				time: now,
				depends: {
					"userId": globalDepStorage["userId"].value,
					"version": globalDepStorage["version"].value,
					"dev": depStorage["dev"].value
				},
				data: 1
			};

			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(value, depOptions, [depStorage, globalDepStorage], now))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(value, {}, [depStorage, globalDepStorage], now))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(value, null, [depStorage, globalDepStorage], now))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(value, null, null, now))
				.toBe(false);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(value, depOptions, null, now))
				.toBe(true);

			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid({time: now - depOptions.expires - 10}, depOptions, [depStorage, globalDepStorage], now))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid({time: now - depOptions.expires - 10}, {}, [depStorage, globalDepStorage], now))
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(null, depOptions, [depStorage, globalDepStorage], now))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid(undefined, depOptions, [depStorage, globalDepStorage], now))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid({depends:{}}, depOptions, [depStorage, globalDepStorage], now))
				.toBe(true);
			expect(SpeedShifter.Services.LocalStorageHelpers.isItemInvalid({}, {}, [depStorage, globalDepStorage]))
				.toBe(false);
		});

		it('composeDeps', function(){
			expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev"], [depStorage]))
				.toEqual({
					dev: depStorage["dev"].value
				});
			expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev"], [depStorage, globalDepStorage]))
				.toEqual({
					userId: globalDepStorage["userId"].value,
					dev: depStorage["dev"].value
				});
			expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev", "version"], [depStorage, globalDepStorage]))
				.toEqual({
					userId: globalDepStorage["userId"].value,
					version: globalDepStorage["version"].value,
					dev: depStorage["dev"].value
				});
			expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId"], [depStorage, globalDepStorage]))
				.toEqual({
					userId: globalDepStorage["userId"].value
				});
			expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId"], []))
				.toBeNull();
			expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["a"], [depStorage, globalDepStorage]))
				.toBeNull();
		});
	});
	describe('service:', function () {
		var localStorage: SpeedShifter.Services.ILocalStorageService,
			$timeout: ng.ITimeoutService,
			$window: {localStorage: Storage};
		beforeEach(function () {
			angular.module('test', ['speedshifter.localStoragePromise']);
		});
		beforeEach(module('test'));
		beforeEach(inject(function (_localStoragePromise_, _$timeout_, _$window_) {
			localStorage = _localStoragePromise_;
			$timeout = _$timeout_;
			$window = _$window_;
		}));
		it('should create new cache factory', function () {
			expect(localStorage).not.toBeNull();
		});
		describe('localStorage:', function () {
			var storage: SpeedShifter.Services.ILocalStorageObject,
				val;
			beforeEach(function () {
				$window.localStorage.clear();
				storage = localStorage("localStorage", <SpeedShifter.Services.ILocalStorageOptions>{});
				val = {a:1, b:2};
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
				expect(storage.get("val")).toBeNull(); // before set
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

				expect(storage.get("val2")).toBeNull(); // no item returned
				expect($window.localStorage.getItem(storage.getLocalStorageKey("val2"))).toBeNull(); // no item is storage itself
			});

			it('clear should remove bunch of items of specific storage object, other should be unaffected', function () {
				var storage2 = localStorage("localStorage2", <SpeedShifter.Services.ILocalStorageOptions>{});

				storage.set("val", val);
				storage.set("val2", val);
				expect(storage.get("val")).toEqual(val);
				expect(storage.get("val2")).toEqual(val);

				var val2 = {c: 1, d: 2},
					val3 = 1,
					val4 = 0;
				storage2.set("val", val2);
				storage2.set("val2", val2);
				storage2.set("val3", val3);
				storage2.set("val4", val4);
				expect(storage2.get("val")).toEqual(val2);
				expect(storage2.get("val2")).toEqual(val2);
				expect(storage2.get("val3")).toEqual(val3);
				expect(storage2.get("val4")).toEqual(val4);

				storage2.clear();

				// all items from storage2 are removed
				expect(storage2.get("val")).toBeNull();
				expect(storage2.get("val2")).toBeNull();
				expect(storage2.get("val3")).toBeNull();
				expect(storage2.get("val4")).toBeNull();

				// no items from storage are removed
				expect(storage.get("val")).toEqual(val);
				expect(storage.get("val2")).toEqual(val);
			});

			it('clearStorage should remove all bunches of items, but don\'t affect other localStorage items', function () {
				var storage2 = localStorage("localStorage2", <SpeedShifter.Services.ILocalStorageOptions>{});

				$window.localStorage.setItem("other item", "other item");

				storage.set("val", val);
				storage.set("val2", val);
				expect(storage.get("val")).toEqual(val);
				expect(storage.get("val2")).toEqual(val);

				var val2 = {c: 1, d: 2},
					val3 = 1,
					val4 = 0;
				storage2.set("val", val2);
				storage2.set("val2", val2);
				storage2.set("val3", val3);
				storage2.set("val4", val4);
				expect(storage2.get("val")).toEqual(val2);
				expect(storage2.get("val2")).toEqual(val2);
				expect(storage2.get("val3")).toEqual(val3);
				expect(storage2.get("val4")).toEqual(val4);

				storage2.clearStorage();

				// all items from storage2 are removed
				expect(storage2.get("val")).toBeNull();
				expect(storage2.get("val2")).toBeNull();
				expect(storage2.get("val3")).toBeNull();
				expect(storage2.get("val4")).toBeNull();

				// no items from storage are removed
				expect(storage.get("val")).toBeNull();
				expect(storage.get("val2")).toBeNull();

				// other items is still here
				expect($window.localStorage.getItem("other item")).toEqual("other item");
			});

			it('storage with same name is same storage', function () {
				var storage2 = localStorage("localStorage", <SpeedShifter.Services.ILocalStorageOptions>{});

				expect(storage2).toBe(storage);
			});
		});
		describe('localStorage: Dependency', function () {
			var storage: SpeedShifter.Services.ILocalStorageObject,
				val,
				userId = "12345",
				version = "1.0";
			beforeEach(function () {
				$window.localStorage.clear();
				storage = localStorage("localStorage", <SpeedShifter.Services.ILocalStorageOptions>{
					dependent: ["userId", "version"]
				});
				val = {a:1, b:2};
			});

			it('if dependency values don\'t set, get should return null', function () {
				expect(storage.get("val")).toBeNull();
				storage.set("val", val);
				expect(storage.get("val")).toBeNull();
			});

			describe('local dependecies:', function () {
				beforeEach(function () {
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
						name: "userId",
						value: userId
					});
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
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

					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
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

					expect(storage.get("val")).toBeNull(); // still null, because item was removed from storage

					storage.set("val", val);
					expect(storage.get("val")).toEqual(val); // after set it should still work normal

					storage.setDependenceVal("version", "2.0"); // shouldn't clean storage immediately
					storage.setDependenceVal("version", version);

					expect(storage.get("val")).toEqual(val);
				});
			});
			describe('global dependecies:', function () {
				beforeEach(function () {
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
						name: "userId",
						value: userId
					}, true);
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
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

					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
						name: "version",
						value: "2.0"
					}, true);

					expect(storage.get("val")).toBeNull();
				});
			});
			describe('global/local dependecies:', function () {
				it('should fail, when local dep is undefined', function () {
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
						name: "userId",
						value: userId
					}, true);

					expect(storage.get("val")).toBeNull();
					storage.set("val", val);
					expect(storage.get("val")).toBeNull(); // "version" dep is missing
				});
				it('global+local should work as normal', function () {
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
						name: "userId",
						value: userId
					}, true);
					storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
						name: "version",
						value: version
					});

					expect(storage.get("val")).toBeNull();
					storage.set("val", val);
					expect(storage.get("val")).toEqual(val);
				});
				describe('global+local', function () {
					beforeEach(function () {
						storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "userId",
							value: userId
						}, true);
						storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "version",
							value: version
						});
					});
					it('second storage should inherit global dependency', function () {
						var storage2 = localStorage("localStorage2", <SpeedShifter.Services.ILocalStorageOptions>{
							dependent: ["userId"]
						});

						expect(storage2.get("val")).toBeNull();
						storage2.set("val", val);
						expect(storage2.get("val")).toEqual(val); // depends only on global dependency
					});
					it('second storage should inherit global dependency, but not local', function () {
						var storage2 = localStorage("localStorage2", <SpeedShifter.Services.ILocalStorageOptions>{
							dependent: ["userId", "version"]
						});

						expect(storage2.get("val")).toBeNull();
						storage2.set("val", val);
						expect(storage2.get("val")).toBeNull(); // should fail, because "version" not setted for this storage
					});
					it('storage with same name is same', function () {
						var storage2 = localStorage("localStorage", <SpeedShifter.Services.ILocalStorageOptions>{
							dependent: ["userId", "version"]
						});

						expect(storage2).toBe(storage);

						expect(storage2.get("val")).toBeNull();
						storage2.set("val", val);
						expect(storage2.get("val")).toEqual(val); // because it is same as storage, so "version" was set
					});
					it('changing local dep shouldn\'t affect other storages', function () {
						var storage2 = localStorage("localStorage2", <SpeedShifter.Services.ILocalStorageOptions>{
							dependent: ["userId", "version"]
						});

						var version2 = "2.0";
						storage2.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "version",
							value: version2
						}, true);

						storage2.set("val", val);
						expect(storage2.get("val")).toEqual(val);

						storage.set("val", val);
						expect(storage.get("val")).toEqual(val);

						storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "version",
							value: version2
						});

						expect(storage.get("val")).toBeNull(); // because local "version" was changed
						expect(storage2.get("val")).toEqual(val); // because global "version" wasn't
					});

					it('changing global dep should affect only storages, that doesn\'t have local copies', function () {
						var storage2 = localStorage("localStorage2", <SpeedShifter.Services.ILocalStorageOptions>{
							dependent: ["userId", "version"]
						});

						var version2 = "2.0";
						storage2.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "version",
							value: version2
						}, true);

						storage2.set("val", val);
						expect(storage2.get("val")).toEqual(val);

						storage.set("val", val);
						expect(storage.get("val")).toEqual(val);

						storage2.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "version",
							value: version
						}, true);

						expect(storage.get("val")).toEqual(val);
						expect(storage2.get("val")).toBeNull();

						storage.setDependence(<SpeedShifter.Services.ILocalStorageDepend>{
							name: "version",
							value: version2
						});

						expect(storage.get("val")).toBeNull(); // because local "version" was changed
					});
				});
			});
		});
	});
});