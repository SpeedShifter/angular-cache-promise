/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	var module = angular.module('speedshifter.cache-promise', []);
	module.provider('cache-promise', CachePromiseProvider);
}