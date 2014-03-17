'use strict';
describe('angular-localStorage-cache:', function () {
    describe('LocalStorageHelpers:', function () {
        var globalDepStorage = {
            "userId": { name: "userId", value: "134589" },
            "version": { name: "version", value: { version: "1.0" } },
            "dev": { name: "dev", value: "dev global" }
        };
        var depStorage = {
            "dev": { name: "dev", value: "development" }
        };

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
        });
    });
});
