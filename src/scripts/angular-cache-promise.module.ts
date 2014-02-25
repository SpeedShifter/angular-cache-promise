/// <reference path="../inc.d.ts" />
(function () {
	var module = angular.module('speedshifter.cache-promise', []);
	module.provider('cache-promise', SpeedShifter.Services.CachePromiseProvider);
})();