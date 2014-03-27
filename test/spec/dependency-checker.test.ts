/// <reference path="../inc.d.ts" />

'use strict';

describe('dependency-checker ->', function(){
	describe('DepStorage ->', function() {
		var userId = {name: "userId", value: "134589"},
			compare = {name: "compare", value: {a: 1, b: 2, c: 3}, comparator: function(a, b) {
				return a.a + a.b + a.c == b.a + b.b + b.c;
			}},
			version = {name: "version", value: {version: "1.0", array: [1, 2, 3]}};

		it('compare', function(){
			expect(SpeedShifter.Services.DepStorage.compare(userId, userId.value))
				.toBe(true);
			expect(SpeedShifter.Services.DepStorage.compare(userId, "other val"))
				.toBe(false);
			expect(SpeedShifter.Services.DepStorage.compare(userId, null))
				.toBe(false);
			expect(SpeedShifter.Services.DepStorage.compare(compare, compare.value))
				.toBe(true);
			expect(SpeedShifter.Services.DepStorage.compare(compare, {a: 4, b: 0, c: 2}))
				.toBe(true);
			expect(SpeedShifter.Services.DepStorage.compare(compare, {a: 4, b: 1, c: 2}))
				.toBe(false);
			expect(SpeedShifter.Services.DepStorage.compare({name: "c", value: {a: 1, b: 2, c: [1, 2, 3]}}, {a: 1, b: 2, c: [1, 2, 3]}))
				.toBe(true);
			expect(SpeedShifter.Services.DepStorage.compare({name: "c", value: {a: 1, b: 2, c: [1, 2]}}, {a: 1, b: 2, c: [1, 2, 3]}))
				.toBe(false);
		});

		describe('single storage ->', function() {
			var storage;
			beforeEach(function() {
				storage = new SpeedShifter.Services.DepStorage();
			});
			it('get/set/clear depends', function() {
				expect(storage.getDepend('userId')).toBeNull();
				storage.setDependence(userId);
				storage.setDependenceVal('compare', compare.value);
				expect(storage.getDepend('userId')).toEqual(userId);
				expect(storage.getDepend('compare').value).toEqual(compare.value);
				expect(storage.getDepend('compare')).not.toEqual(compare);
				storage.clear();
				expect(storage.getDepend('userId')).toBeNull();
				expect(storage.getDepend('compare')).toBeNull();
			});
			it('removeDependence', function() {
				storage.setDependence(userId);
				expect(storage.getDepend('userId')).toEqual(userId);
				storage.removeDependence('userId');
				expect(storage.getDepend('userId')).toBeNull();
			});
		});
	});

	/*describe('LocalStorageHelpers ->', function(){
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
	});*/
});