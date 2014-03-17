'use strict';
describe('angular-localStorage-cache:', function () {
    describe('LocalStorageHelpers:', function () {
        var globalDepStorage = {
            "userId": { name: "userId", value: "134589" },
            "version": { name: "version", value: { version: "1.0", array: [1, 2, 3] } },
            "dev": { name: "dev", value: "dev global" },
            "compare": {
                name: "compare", value: { a: 1, b: 2, c: 3 }, comparator: function (a, b) {
                    return a.a + a.b + a.c == b.a + b.b + b.c;
                } }
        };
        var depStorage = {
            "dev": { name: "dev", value: "development" }
        };

        it('getDepend', function () {
            expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("userId", [depStorage, globalDepStorage])).toEqual(globalDepStorage["userId"]);
            expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("dev", [depStorage, globalDepStorage])).toEqual(depStorage["dev"]);
            expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("dev", [depStorage, globalDepStorage])).toNotEqual(globalDepStorage["dev"]);
            expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("version", [depStorage, depStorage, depStorage, depStorage, globalDepStorage])).toEqual(globalDepStorage["version"]);
            expect(SpeedShifter.Services.LocalStorageHelpers.getDepend("a", [depStorage, globalDepStorage])).toBeUndefined();
        });

        it('compare', function () {
            expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["userId"], globalDepStorage["userId"].value)).toBe(true);
            expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["userId"], "other val")).toBe(false);
            expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["userId"], null)).toBe(false);
            expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["compare"], globalDepStorage["compare"].value)).toBe(true);
            expect(SpeedShifter.Services.LocalStorageHelpers.compare(globalDepStorage["compare"], { a: 4, b: 0, c: 2 })).toBe(true);
        });

        it('composeDeps', function () {
            expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev"], [depStorage])).toEqual({
                dev: depStorage["dev"].value
            });
            expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev"], [depStorage, globalDepStorage])).toEqual({
                userId: globalDepStorage["userId"].value,
                dev: depStorage["dev"].value
            });
            expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId", "dev", "version"], [depStorage, globalDepStorage])).toEqual({
                userId: globalDepStorage["userId"].value,
                version: globalDepStorage["version"].value,
                dev: depStorage["dev"].value
            });
            expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId"], [depStorage, globalDepStorage])).toEqual({
                userId: globalDepStorage["userId"].value
            });
            expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["userId"], [])).toBeUndefined();
            expect(SpeedShifter.Services.LocalStorageHelpers.composeDeps(["a"], [depStorage, globalDepStorage])).toBeUndefined();
        });
    });
});
