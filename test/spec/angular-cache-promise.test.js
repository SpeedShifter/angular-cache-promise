'use strict';
describe('angular-cache-promise:', function () {
    var cachePromise;
    beforeEach(function () {
        angular.module('test', ['speedshifter.cachePromise']);
    });
    beforeEach(module('test'));
    beforeEach(inject(function (_cachePromise_) {
        cachePromise = _cachePromise_;
    }));
    describe('cachePromise:', function () {
        it('should create new cache factory', function () {
            expect(cachePromise).not.toBeNull();
        });
        it('should create new cache object', function () {
            var cache = cachePromise("cache1", {
                capacity: 100,
                timeout: 10 * 1000,
                JQPromise: true
            });
            expect(cache).toBeDefined();
            expect(cache.get).toBeDefined();
            expect(cache.set).toBeDefined();
            expect(cache.remove).toBeDefined();
            expect(cache.removeAll).toBeDefined();
        });
    });
    describe('cachePromise:', function () {
        var cache, def, promise, val;
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
        it('should work set/get', function () {
            expect(cache.set("val", promise)).toEqual(promise);
            expect(cache.get("val")).toBeUndefined();
            expect(cache.get("val")).not.toBeNull();

            def.resolve(val);

            expect(cache.get("val")).not.toBeUndefined();
            expect(cache.get("val")).toEqual(val);
        });
    });
});
