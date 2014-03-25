/// <reference path="../inc.d.ts" />

'use strict';

describe('angular-cache-promise:', function(){
	var cachePromise: SpeedShifter.Services.ICachePromiseService,
		$timeout: ng.ITimeoutService,
		$q: ng.IQService;
	beforeEach(function () {
		angular.module('test', ['speedshifter.cachePromise']);
	});
	beforeEach(module('test'));
	beforeEach(inject(function (_cachePromise_, _$q_, _$timeout_) {
		cachePromise = _cachePromise_;
		$q = _$q_;
		$timeout = _$timeout_;
	}));
	it('should create new cache factory', function () {
		expect(cachePromise).not.toBeNull();
	});
	describe('cachePromise:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val,
			result;
		beforeEach(function () {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 10*1000
			});
			def = $q.defer();
			promise = def.promise;
			val = 1;
			result = undefined;
		});

		it('no cache to be undefined', function () {
			expect(cache.get("val")).toBeNull(); // before set
		});
		it('should create new cache object', function () {
			expect(cache).toBeDefined();
			expect(cache.get).toBeDefined();
			expect(cache.set).toBeDefined();
			expect(cache.remove).toBeDefined();
			expect(cache.removeAll).toBeDefined();
		});
		it('after resolving promise, get should be resoled with correct value', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			});
			expect(result).toBeUndefined();

			def.resolve(val);

			$timeout.flush();
			expect(result).toBe(val);

			var result2;
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result2 = data;
			});

			$timeout.flush();
			expect(result2).toBe(val);
		});
		it('resolving promise shouldn\'t rely on removing item from cache', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			});

			cache.removeAll();
			def.resolve(val);
			$timeout.flush();

			expect(result).toBe(val);
			expect(cache.get("val")).toBeNull();
		});
		it('cache with same name, should be same', function () {
			var cache2 = cachePromise("cache1", null);
			expect(cache2).toEqual(cache);

			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			});
			var result2;
			cache2.get<ng.IPromise<any>>("val").then(function (data) {
				result2 = data;
			});

			def.resolve(val);

			$timeout.flush();
			expect(result).toBe(val);
			expect(result2).toBe(val);
		});
	});
	describe('cachePromise: saveFail:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val,
			result;
		beforeEach(function () {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 10*1000,
				saveFail: true
			});
			def = $q.defer();
			promise = def.promise;
			val = 1;
			result = undefined;
		});
		it('when saveFail is true, after rejecting, cache.get("val") should still return promise, but already rejected with fail values', function () {
			cache.set("val", promise);

			def.reject(val);
			$timeout.flush();

			expect(result).toBeUndefined();
			expect(cache.get("val")).toBeDefined();

			var result2;
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			}, function (data) {
				result2 = data;
			});

			$timeout.flush();
			expect(result).toBeUndefined();
			expect(result2).toBe(val);
			expect(cache.get("val")).toBeDefined();
		});
		it('setOptions should change cache behavior', function () {
			cache.setOptions({
				saveFail: false
			});

			cache.set("val", promise);

			var result2;
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			}, function (data) {
				result2 = data;
			});

			def.reject(val);
			$timeout.flush();

			expect(result).toBeUndefined();
			expect(result2).toBe(val);

			expect(cache.get("val")).toBeNull();
		});
	});
	describe('cachePromise: timeouts:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val, result;
		beforeEach(inject(function (_cachePromise_) {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 5*1000
			});
			def = $q.defer();
			promise = def.promise;
			val = 1;
			result = undefined;
		}));

		beforeEach(function() {
			jasmine.clock().install();
		});

		beforeEach(function() {
			spyOn(Date.prototype, 'getTime').and.returnValue(0);
			Date.prototype.getTime['and'].returnValue(0);
		});

		afterEach(function() {
			jasmine.clock().uninstall();
		});

		it('after failed promise, get should return undefined', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").catch(function (data) {
				result = data;
			});

			def.reject(val);

			$timeout.flush();
			expect(result).toBe(val);

			jasmine.clock().tick(10);

			setTimeout(()=>{
				expect(cache.get("val")).toBeNull();
			}, 10)
		});

		it('should expire', function () {
			jasmine.clock().tick(0);

			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			});

			jasmine.clock().tick(2*1000);
			Date.prototype.getTime['and'].returnValue(2*1000);

			expect(cache.get("val")).toBeDefined();

			def.resolve(val);

			$timeout.flush();
			expect(result).toBe(val);

			jasmine.clock().tick(4*1000);
			Date.prototype.getTime['and'].returnValue(4*1000);

			result = null;
			expect(
				cache.get<ng.IPromise<any>>("val")
					.then(function (data) {
						result = data;
					})
			).toBeDefined();

			$timeout.flush();
			expect(result).toBe(val);

			jasmine.clock().tick(10*1000);
			Date.prototype.getTime['and'].returnValue(10*1000);

			setTimeout(()=>{
				expect(cache.get("val")).toBeNull();
			}, 10)
		});

		it('should work with multiple promises', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			var result1, result2;
			cache.get<ng.IPromise<any>>("val").catch(function (data) {
				result = data;
			});
			cache.get<ng.IPromise<any>>("val").catch(function (data) {
				result1 = data;
			});
			cache.get<ng.IPromise<any>>("val").catch(function (data) {
				result2 = data;
			});

			def.reject(val);

			$timeout.flush();
			expect(result).toBe(val);
			expect(result1).toBe(val);
			expect(result2).toBe(val);
		});
	});
	describe('cachePromise: JQuery:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: JQueryDeferred<any>,
			promise: JQueryPromise<any>,
			val, result;
		beforeEach(inject(function (_cachePromise_) {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 10*1000,
				JQPromise: true
			});
			def = $.Deferred();
			promise = def.promise();
			val = 1;
			result = undefined;
		}));
		it('no cache to be undefined', function () {
			expect(cache.get("val")).toBeNull(); // before set
		});
		it('after set unresolved promise, get should return promise', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			expect(cache.get("val")).toEqual(promise); // after set
		});
		it('after resolving promise, get should be resoled with correct value', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<JQueryPromise<any>>("val").then(function (data) {
				result = data;
			});

			expect(result).toBeUndefined();

			def.resolve(val);

			expect(result).toBe(val);
		});
		it('multiple resolve values', function () {
			var val2 = {a: 1, b: 2};
			var val3 = this;
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<JQueryPromise<any>>("val").done(function (data, data2, data3) {
				expect(data).toEqual(val);
				expect(data2).toEqual(val2);
				expect(data3).toEqual(val3);
			});

			def.resolve(val, val2, val3);

			cache.get<JQueryPromise<any>>("val").done(function (data, data2, data3) {
				expect(data).toEqual(val);
				expect(data2).toEqual(val2);
				expect(data3).toEqual(val3);
			});
		});
	});
	describe('cachePromise: dontSaveResult:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val,
			result;
		beforeEach(function () {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 0,
				dontSaveResult: true
			});
			def = $q.defer();
			promise = def.promise;
			val = 1;
			result = undefined;
		});
		it('after resolving, cache value should be removed', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			expect(cache.get("val")).toEqual(promise);
			cache.get<JQueryPromise<any>>("val").then(function (data) {
				result = data;
			});
			var result2;
			cache.get<JQueryPromise<any>>("val").then(function (data) {
				result2 = data;
			});

			expect(result).toBeUndefined();
			expect(result2).toBeUndefined();

			def.resolve(val);
			$timeout.flush();

			expect(result).toBe(val);
			expect(result2).toBe(val);

			expect(cache.get("val")).toBeNull();
		});
	});
	describe('cachePromise: defResolver:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val, result,
			options = {
				capacity: 100, // for angular $cacheFactory
				defResolver: <SpeedShifter.Services.ICachePromiseDefResolver<ng.IPromise<any>>> function (values:any[], failed?: boolean) {
					var def = $q.defer();
					(!failed ? def.resolve : def.reject) .apply(this, values);
					return def.promise;
				}
			};

		beforeEach(function () {
			spyOn(options, 'defResolver').and.callThrough();

			cache = cachePromise("cache2", options);

			def = $q.defer();
			promise = def.promise;
			val = 1;
			result = undefined;
		});
		it('new defResolver should be called instead of builtin', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result = data;
			});
			expect(result).toBeUndefined();

			def.resolve(val);

			$timeout.flush();
			expect(result).toBe(val);
			expect(options.defResolver).not.toHaveBeenCalled();

			var result2;
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				result2 = data;
			});

			$timeout.flush();
			expect(result2).toBe(val);
			expect(options.defResolver).toHaveBeenCalled();
		});
	});
});