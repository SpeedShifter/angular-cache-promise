'use strict';
describe('dependency-checker ->', function () {
    describe('DepStorage ->', function () {
        var userId = { name: "userId", value: "134589" }, compare = {
            name: "compare", value: { a: 1, b: 2, c: 3 }, comparator: function (a, b) {
                return a.a + a.b + a.c == b.a + b.b + b.c;
            } }, version = { name: "version", value: { version: "1.0", array: [1, 2, 3] } };

        it('compare', function () {
            expect(SpeedShifter.Services.DepStorage.compare(userId, userId.value)).toBe(true);
            expect(SpeedShifter.Services.DepStorage.compare(userId, "other val")).toBe(false);
            expect(SpeedShifter.Services.DepStorage.compare(userId, null)).toBe(false);
            expect(SpeedShifter.Services.DepStorage.compare(compare, compare.value)).toBe(true);
            expect(SpeedShifter.Services.DepStorage.compare(compare, { a: 4, b: 0, c: 2 })).toBe(true);
            expect(SpeedShifter.Services.DepStorage.compare(compare, { a: 4, b: 1, c: 2 })).toBe(false);
            expect(SpeedShifter.Services.DepStorage.compare({ name: "c", value: { a: 1, b: 2, c: [1, 2, 3] } }, { a: 1, b: 2, c: [1, 2, 3] })).toBe(true);
            expect(SpeedShifter.Services.DepStorage.compare({ name: "c", value: { a: 1, b: 2, c: [1, 2] } }, { a: 1, b: 2, c: [1, 2, 3] })).toBe(false);
        });

        describe('single storage ->', function () {
            var storage;
            beforeEach(function () {
                storage = new SpeedShifter.Services.DepStorage();
            });
            it('get/set/clear depends', function () {
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
            it('removeDependence', function () {
                storage.setDependence(userId);
                expect(storage.getDepend('userId')).toEqual(userId);
                storage.removeDependence('userId');
                expect(storage.getDepend('userId')).toBeNull();
            });
        });
    });
});
