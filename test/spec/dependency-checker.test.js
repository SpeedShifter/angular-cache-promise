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

                var changeable = { name: "changeable", value: "654" };
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
            it('removeDependence', function () {
                storage.setDependence(userId);
                expect(storage.getDepend('userId')).toEqual(userId);
                storage.removeDependence('userId');
                expect(storage.getDepend('userId')).toBeNull();
            });
            it('isDependentFailed', function () {
                storage.setDependence(userId);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, ["version", "compare", "userId"])).toEqual(true);
                storage.setDependence(compare);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, ["version", "compare", "userId"])).toEqual(true);
                storage.setDependence(version);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, ["version", "compare", "userId"])).toEqual(false);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, ["version", "compare"])).toEqual(false);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, ["version"])).toEqual(false);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, [])).toEqual(false);
                expect(storage.isDependentFailed({ userId: userId.value, version: version.value, compare: compare.value }, null)).toEqual(false);

                expect(storage.isDependentFailed({}, ["version"])).toEqual(true);
                expect(storage.isDependentFailed({}, null)).toEqual(false);
                expect(storage.isDependentFailed(null, null)).toEqual(false);
                expect(storage.isDependentFailed(null, [])).toEqual(false);
                expect(storage.isDependentFailed(null, ["version"])).toEqual(true);

                expect(storage.isDependentFailed({ compare: { a: 0, b: 5, c: 1 } }, ["compare"])).toEqual(false);
                expect(storage.isDependentFailed({ compare: { a: 1, b: 5, c: 1 } }, ["compare"])).toEqual(true);

                storage.setDependenceVal("compare", { a: 1, b: 3, c: 3 });
                expect(storage.isDependentFailed({ compare: { a: 1, b: 5, c: 1 } }, ["compare"])).toEqual(false);
            });
            it('composeDeps', function () {
                storage.setDependence(userId);
                expect(storage.composeDeps(["userId"])).toEqual({ userId: userId.value });
                expect(storage.composeDeps(["userId", "version"])).toEqual({ userId: userId.value });

                storage.setDependence(version);
                expect(storage.composeDeps(["userId", "version"])).not.toEqual({ userId: userId.value });
                expect(storage.composeDeps(["userId", "version"])).toEqual({ userId: userId.value, version: version.value });

                storage.setDependenceVal("compare", { a: 0, b: 5, c: 1 });
                expect(storage.composeDeps(["userId", "version", "compare"])).not.toEqual({ userId: userId.value, version: version.value, compare: compare.value });

                expect(storage.composeDeps(null)).toBeUndefined();
                expect(storage.composeDeps([])).toBeUndefined();
                expect(storage.composeDeps(["a"])).toBeUndefined();

                storage.setDependence(compare);
                var deps = ["userId", "version", "compare"];
                var vals = storage.composeDeps(deps);

                expect(storage.isDependentFailed(vals, deps)).toBe(false);

                storage.setDependenceVal("compare", { a: 0, b: 5, c: 20 });
                expect(storage.isDependentFailed(vals, deps)).toBe(true);

                storage.setDependenceVal("compare", { a: 1, b: 3.5, c: 1.5 });
                expect(storage.isDependentFailed(vals, deps)).toBe(false);
            });
        });
    });
});
