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

				var changeable = {name: "changeable", value: "654"};
				storage.setDependence(changeable);
				expect(storage.getDepend('changeable')).toEqual(changeable);
				storage.setDependenceVal('changeable', "564");
				expect(storage.getDepend('changeable')).not.toEqual(changeable);
				expect(storage.getDepend('changeable').value).toBe("564");
				expect(changeable.value).toBe("654");

				storage.setDependence(changeable);
				changeable.value = "ss";
				expect(storage.getDepend('changeable')).not.toEqual(changeable);
				expect(storage.getDepend('changeable').value).not.toBe("ss");
			});
			it('removeDependence', function() {
				storage.setDependence(userId);
				expect(storage.getDepend('userId')).toEqual(userId);
				storage.removeDependence('userId');
				expect(storage.getDepend('userId')).toBeNull();
			});
			it('isDependentFailed', function() {
				storage.setDependence(userId);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, ["version", "compare", "userId"])).toEqual(true); // not enought depends
				storage.setDependence(compare);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, ["version", "compare", "userId"])).toEqual(true); // not enought depends
				storage.setDependence(version);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, ["version", "compare", "userId"])).toEqual(false);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, ["version", "compare"])).toEqual(false);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, ["version"])).toEqual(false);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, [])).toEqual(false);
				expect(storage.isDependentFailed({userId: userId.value, version: version.value, compare: compare.value}, null)).toEqual(false);

				expect(storage.isDependentFailed({}, ["version"])).toEqual(true);
				expect(storage.isDependentFailed({}, null)).toEqual(false);
				expect(storage.isDependentFailed(null, null)).toEqual(false);
				expect(storage.isDependentFailed(null, [])).toEqual(false);
				expect(storage.isDependentFailed(null, ["version"])).toEqual(true);

				expect(storage.isDependentFailed({compare: {a: 0, b: 5, c: 1}}, ["compare"])).toEqual(false);
				expect(storage.isDependentFailed({compare: {a: 1, b: 5, c: 1}}, ["compare"])).toEqual(true); // comparator will return false

				storage.setDependenceVal("compare", {a: 1, b: 3, c: 3});
				expect(storage.isDependentFailed({compare: {a: 1, b: 5, c: 1}}, ["compare"])).toEqual(false);
			});
			it('composeDeps', function() {
				storage.setDependence(userId);
				expect(storage.composeDeps(["userId"])).toEqual({userId: userId.value});
				expect(storage.composeDeps(["userId", "version"])).toEqual({userId: userId.value});

				storage.setDependence(version);
				expect(storage.composeDeps(["userId", "version"])).not.toEqual({userId: userId.value});
				expect(storage.composeDeps(["userId", "version"])).toEqual({userId: userId.value, version: version.value});

				storage.setDependenceVal("compare", {a: 0, b: 5, c: 1});
				expect(storage.composeDeps(["userId", "version", "compare"])).not.toEqual({userId: userId.value, version: version.value, compare: compare.value}); // values of "compare" are different

				expect(storage.composeDeps(null)).toBeUndefined();
				expect(storage.composeDeps([])).toBeUndefined();
				expect(storage.composeDeps(["a"])).toBeUndefined();

				storage.setDependence(compare);
				var deps = ["userId", "version", "compare"];
				var vals = storage.composeDeps(deps);

				expect(storage.isDependentFailed(vals, deps)).toBe(false);

				storage.setDependenceVal("compare", {a: 0, b: 5, c: 20});
				expect(storage.isDependentFailed(vals, deps)).toBe(true);

				storage.setDependenceVal("compare", {a: 1, b: 3.5, c: 1.5});
				expect(storage.isDependentFailed(vals, deps)).toBe(false);
			});
		});
		describe('multiple storages ->', function() {
			var storage1;
			beforeEach(function() {
				storage1 = new SpeedShifter.Services.DepStorage();
			});
			it('should inherit dependencies', function() {
				var storage2 = new SpeedShifter.Services.DepStorage(storage1),
					storage3 = new SpeedShifter.Services.DepStorage(storage2),
					storage4 = new SpeedShifter.Services.DepStorage(storage2, storage3);

				storage1.setDependence(userId);
				expect(storage1.getDepend('userId')).toEqual(userId);
				expect(storage2.getDepend('userId')).toEqual(userId);
				expect(storage3.getDepend('userId')).toEqual(userId);
				expect(storage4.getDepend('userId')).toEqual(userId);

				storage2.setDependence(version);
				expect(storage1.getDepend('version')).toBeNull();
				expect(storage2.getDepend('version')).toEqual(version);
				expect(storage3.getDepend('version')).toEqual(version);
				expect(storage4.getDepend('version')).toEqual(version);

				storage3.setDependenceVal('version', 434);
				expect(storage1.getDepend('version')).toBeNull();
				expect(storage2.getDepend('version')).toEqual(version);
				expect(storage3.getDepend('version').value).toEqual(434);
				expect(storage4.getDepend('version').value).toEqual(434);
			});
			it('should inherit dependencies in correct order', function() {
				var storage2 = new SpeedShifter.Services.DepStorage(),
					storage3 = new SpeedShifter.Services.DepStorage(),
					storage4 = new SpeedShifter.Services.DepStorage(storage1, storage2, storage3),
					storage5 = new SpeedShifter.Services.DepStorage(storage2, storage3, storage1),
					storage6 = new SpeedShifter.Services.DepStorage(storage3, storage1, storage2),
					storage7 = new SpeedShifter.Services.DepStorage(storage3, storage2, storage1),
					storage8 = new SpeedShifter.Services.DepStorage(storage1, storage3, storage2);

				storage1.setDependenceVal("1", 1);
				storage2.setDependenceVal("1", 2);
				storage3.setDependenceVal("1", 3);

				expect(storage1.getDepend('1').value).toEqual(1);
				expect(storage2.getDepend('1').value).toEqual(2);
				expect(storage3.getDepend('1').value).toEqual(3);

				expect(storage4.getDepend('1').value).toEqual(3); // inherited from storage3
				expect(storage5.getDepend('1').value).toEqual(1);
				expect(storage6.getDepend('1').value).toEqual(2);
				expect(storage7.getDepend('1').value).toEqual(1);
				expect(storage8.getDepend('1').value).toEqual(2);

				storage2.setDependenceVal("2", 12);
				storage3.setDependenceVal("2", 13);

				expect(storage4.getDepend('2').value).toEqual(13); // inherited from storage3
				expect(storage5.getDepend('2').value).toEqual(13);
				expect(storage6.getDepend('2').value).toEqual(12);
				expect(storage7.getDepend('2').value).toEqual(12);
				expect(storage8.getDepend('2').value).toEqual(12);

				storage3.setDependenceVal("3", 13);

				expect(storage4.getDepend('3').value).toEqual(13); // inherited from storage3
				expect(storage5.getDepend('3').value).toEqual(13);
				expect(storage6.getDepend('3').value).toEqual(13);
				expect(storage7.getDepend('3').value).toEqual(13);
				expect(storage8.getDepend('3').value).toEqual(13);
			});

			it('setGlobals / getGlobals', function() {
				var storage2 = new SpeedShifter.Services.DepStorage(),
					storage3 = new SpeedShifter.Services.DepStorage(storage1);

				expect(storage2.getGlobals()).toEqual([]);
				expect(storage3.getGlobals()).toEqual([storage1]);

				storage2.setGlobals(storage3, storage1);
				expect(storage2.getGlobals()).toEqual([storage3, storage1]);
			});
			it('appendGlobals / prependGlobals / clearGlobals', function() {
				var storage2 = new SpeedShifter.Services.DepStorage(),
					storage3 = new SpeedShifter.Services.DepStorage(storage1);

				expect(storage2.getGlobals()).toEqual([]);

				storage2.appendGlobals(storage1);
				expect(storage2.getGlobals()).toEqual([storage1]);

				storage2.appendGlobals(storage2, storage3);
				expect(storage2.getGlobals()).toEqual([storage1, storage2, storage3]);

				storage2.prependGlobals(storage3, storage2, storage1);
				expect(storage2.getGlobals()).toEqual([storage3, storage2, storage1, storage1, storage2, storage3]);

				storage2.clearGlobals();
				expect(storage2.getGlobals()).toEqual([]);
			});
		});
	});
});