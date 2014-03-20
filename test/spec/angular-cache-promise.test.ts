/// <reference path="../inc.d.ts" />

'use strict';

describe('angular-cache-promise:', function(){
	var cachePromise: SpeedShifter.Services.ICachePromiseService,
		$q: ng.IQService;
	beforeEach(function () {
		angular.module('test', ['speedshifter.cachePromise']);
	});
	beforeEach(module('test'));
	beforeEach(inject(function (_cachePromise_, _$q_) {
		cachePromise = _cachePromise_;
		$q = _$q_;
	}));
	describe('cachePromise:', function () {
		it('should create new cache factory', function () {
			expect(cachePromise).not.toBeNull();
		});
		it('should create new cache object', function () {
			var cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 10*1000
			});
			expect(cache).toBeDefined();
			expect(cache.get).toBeDefined();
			expect(cache.set).toBeDefined();
			expect(cache.remove).toBeDefined();
			expect(cache.removeAll).toBeDefined();
		});
	});
	describe('cachePromise:', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val;
		beforeEach(inject(function (_cachePromise_) {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 10*1000
			});
			def = $q.defer();
			val = 1;
			promise = def.promise;
		}));
		it('no cache to be undefined', function () {
			expect(cache.get("val")).toBeUndefined(); // before set
		});
		it('after set unresolved promise, get should return promise', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			expect(cache.get("val")).toEqual(promise); // after set
		});
		it('after resolving promise, get should be resoled with correct value', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				expect(data).not.toBeUndefined();
				expect(data).toEqual(val);
			});

			def.resolve(val);

			cache.get<ng.IPromise<any>>("val").then(function (data) {
				expect(data).not.toBeUndefined();
				expect(data).toEqual(val);
			});
		});
		it('resolving promise shouldn\'t rely on removing item from cache', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				expect(data).not.toBeUndefined();
				expect(data).toEqual(val);
			});

			cache.removeAll();
			def.resolve(val);

			expect(cache.get("val")).toBeUndefined();
		});
	});
	describe('cachePromise: timeouts', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: ng.IDeferred<any>,
			promise: ng.IPromise<any>,
			val;
		beforeEach(inject(function (_cachePromise_) {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 5*1000,
				JQPromise: true
			});
			def = $q.defer();
			val = 1;
			promise = def.promise;
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
				expect(data).toEqual(val); // rejected with val
			});

			def.reject(val);

			jasmine.clock().tick(10);

			setTimeout(()=>{
				expect(cache.get("val")).toBeUndefined();
			}, 10)
		});

		it('should expire', function () {
			jasmine.clock().tick(0);

			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<ng.IPromise<any>>("val").then(function (data) {
				expect(data).toEqual(val);
			});

			jasmine.clock().tick(2*1000);
			Date.prototype.getTime['and'].returnValue(2*1000);

			expect(cache.get("val")).toBeDefined();

			def.resolve(val);

			jasmine.clock().tick(4*1000);
			Date.prototype.getTime['and'].returnValue(4*1000);

			expect(
				cache.get<ng.IPromise<any>>("val")
					.then(function (data) {
						expect(data).toEqual(val); // rejected with val
					})
			).toBeDefined();

			jasmine.clock().tick(10*1000);
			Date.prototype.getTime['and'].returnValue(10*1000);

			setTimeout(()=>{
				expect(cache.get("val")).toBeUndefined();
			}, 10)
		});
	});
	describe('cachePromise: JQuery', function () {
		var cache: SpeedShifter.Services.ICachePromiseObject,
			def: JQueryDeferred<any>,
			promise: JQueryPromise<any>,
			val;
		beforeEach(inject(function (_cachePromise_) {
			cache = cachePromise("cache1", {
				capacity: 100, // for angular $cacheFactory
				timeout: 10*1000,
				JQPromise: true
			});
			def = $.Deferred();
			val = 1;
			promise = def.promise();
		}));
		it('no cache to be undefined', function () {
			expect(cache.get("val")).toBeUndefined(); // before set
		});
		it('after set unresolved promise, get should return promise', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			expect(cache.get("val")).toEqual(promise); // after set
		});
		it('after resolving promise, get should be resoled with correct value', function () {
			expect(cache.set("val", promise)).toEqual(promise);
			cache.get<JQueryPromise<any>>("val").then(function (data) {
				expect(data).not.toBeUndefined();
				expect(data).toEqual(val);
			});

			def.resolve(val);

			cache.get<JQueryPromise<any>>("val").then(function (data) {
				expect(data).not.toBeUndefined();
				expect(data).toEqual(val);
			});
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
});