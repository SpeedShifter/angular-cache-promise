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
				.toBe(false);

			expect(SpeedShifter.Services.LocalStorageHelpers.isDependentFailed({"a": 1}, ["a"], [depStorage, globalDepStorage]))
				.toBe(true);

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
				expect(storage.get("val")).toEqual({b:2, a:1});

				expect($window.localStorage.getItem(storage.getLocalStorageKey("val"))).toBeDefined();
			});
			it('hardcore $window.localStorage.clear should remove all items', function () {
				$window.localStorage.clear();
				expect($window.localStorage.getItem(storage.getLocalStorageKey("val"))).toBeNull();
			});
		});
	});
});