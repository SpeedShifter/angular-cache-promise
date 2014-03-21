'use strict';
describe('angular-cache-promise:', function () {
    var cachePromise, $timeout, $q;
    beforeEach(function () {
        angular.module('test', ['speedshifter.cachePromise']);
    });
    beforeEach(module('test'));
    beforeEach(inject(function (_cachePromise_, _$q_, _$timeout_) {
        cachePromise = _cachePromise_;
        $q = _$q_;
        $timeout = _$timeout_;
    }));
    describe('cachePromise:', function () {
        it('should create new cache factory', function () {
            expect(cachePromise).not.toBeNull();
        });
        it('should create new cache object', function () {
            var cache = cachePromise("cache1", {
                capacity: 100,
                timeout: 10 * 1000
            });
            expect(cache).toBeDefined();
            expect(cache.get).toBeDefined();
            expect(cache.set).toBeDefined();
            expect(cache.remove).toBeDefined();
            expect(cache.removeAll).toBeDefined();
        });
    });
    describe('cachePromise:', function () {
        var cache, def, promise, val, result;
        beforeEach(function () {
            cache = cachePromise("cache1", {
                capacity: 100,
                timeout: 10 * 1000
            });
            def = $q.defer();
            val = 1;
            promise = def.promise;
        });
        it('no cache to be undefined', function () {
            expect(cache.get("val")).toBeUndefined();
        });
        it('after set unresolved promise, get should return promise', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            expect(cache.get("val")).toEqual(promise);
        });
        it('after resolving promise, get should be resoled with correct value', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            cache.get("val").then(function (data) {
                result = data;
            });
            expect(result).toBeUndefined();

            def.resolve(val);

            $timeout.flush();
            expect(result).toBe(val);

            var result2;
            cache.get("val").then(function (data) {
                result2 = data;
            });

            $timeout.flush();
            expect(result2).toBe(val);
        });
        it('resolving promise shouldn\'t rely on removing item from cache', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            cache.get("val").then(function (data) {
                result = data;
            });

            cache.removeAll();
            def.resolve(val);
            $timeout.flush();

            expect(result).toBe(val);
            expect(cache.get("val")).toBeUndefined();
        });
    });
    describe('cachePromise: timeouts:', function () {
        var cache, def, promise, val, result;
        beforeEach(inject(function (_cachePromise_) {
            cache = cachePromise("cache1", {
                capacity: 100,
                timeout: 5 * 1000
            });
            def = $q.defer();
            val = 1;
            promise = def.promise;
        }));

        beforeEach(function () {
            jasmine.clock().install();
        });

        beforeEach(function () {
            spyOn(Date.prototype, 'getTime').and.returnValue(0);
            Date.prototype.getTime['and'].returnValue(0);
        });

        afterEach(function () {
            jasmine.clock().uninstall();
        });

        it('after failed promise, get should return undefined', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            cache.get("val").catch(function (data) {
                result = data;
            });

            def.reject(val);

            $timeout.flush();
            expect(result).toBe(val);

            jasmine.clock().tick(10);

            setTimeout(function () {
                expect(cache.get("val")).toBeUndefined();
            }, 10);
        });

        it('should expire', function () {
            jasmine.clock().tick(0);

            expect(cache.set("val", promise)).toEqual(promise);
            cache.get("val").then(function (data) {
                result = data;
            });

            jasmine.clock().tick(2 * 1000);
            Date.prototype.getTime['and'].returnValue(2 * 1000);

            expect(cache.get("val")).toBeDefined();

            def.resolve(val);

            $timeout.flush();
            expect(result).toBe(val);

            jasmine.clock().tick(4 * 1000);
            Date.prototype.getTime['and'].returnValue(4 * 1000);

            result = null;
            expect(cache.get("val").then(function (data) {
                result = data;
            })).toBeDefined();

            $timeout.flush();
            expect(result).toBe(val);

            jasmine.clock().tick(10 * 1000);
            Date.prototype.getTime['and'].returnValue(10 * 1000);

            setTimeout(function () {
                expect(cache.get("val")).toBeUndefined();
            }, 10);
        });

        it('should work with multiple promises', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            var result1, result2;
            cache.get("val").catch(function (data) {
                result = data;
            });
            cache.get("val").catch(function (data) {
                result1 = data;
            });
            cache.get("val").catch(function (data) {
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
        var cache, def, promise, val, result;
        beforeEach(inject(function (_cachePromise_) {
            cache = cachePromise("cache1", {
                capacity: 100,
                timeout: 10 * 1000,
                JQPromise: true
            });
            def = $.Deferred();
            val = 1;
            promise = def.promise();
        }));
        it('no cache to be undefined', function () {
            expect(cache.get("val")).toBeUndefined();
        });
        it('after set unresolved promise, get should return promise', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            expect(cache.get("val")).toEqual(promise);
        });
        it('after resolving promise, get should be resoled with correct value', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            cache.get("val").then(function (data) {
                result = data;
            });

            expect(result).toBeUndefined();

            def.resolve(val);

            expect(result).toBe(val);
        });
        it('multiple resolve values', function () {
            var val2 = { a: 1, b: 2 };
            var val3 = this;
            expect(cache.set("val", promise)).toEqual(promise);
            cache.get("val").done(function (data, data2, data3) {
                expect(data).toEqual(val);
                expect(data2).toEqual(val2);
                expect(data3).toEqual(val3);
            });

            def.resolve(val, val2, val3);

            cache.get("val").done(function (data, data2, data3) {
                expect(data).toEqual(val);
                expect(data2).toEqual(val2);
                expect(data3).toEqual(val3);
            });
        });
    });
    describe('cachePromise: dontSaveResult:', function () {
        var cache, def, promise, val, result;
        beforeEach(function () {
            cache = cachePromise("cache1", {
                capacity: 100,
                timeout: 0,
                dontSaveResult: true
            });
            def = $q.defer();
            val = 1;
            promise = def.promise;
        });
        it('after resolving, cache value should be removed', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            expect(cache.get("val")).toEqual(promise);
            cache.get("val").then(function (data) {
                result = data;
            });
            var result2;
            cache.get("val").then(function (data) {
                result2 = data;
            });

            expect(result).toBeUndefined();
            expect(result2).toBeUndefined();

            def.resolve(val);
            $timeout.flush();

            expect(result).toBe(val);
            expect(result2).toBe(val);

            expect(cache.get("val")).toBeUndefined();
        });
    });
});
