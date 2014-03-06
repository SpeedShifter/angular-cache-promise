/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	var module = angular.module('speedshifter.cachePromise') || angular.module('speedshifter.cachePromise', []);
	module.provider('cachePromise', CachePromiseProvider);
}