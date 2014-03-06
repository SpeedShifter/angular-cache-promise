/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	var module = angular.module('speedshifter.localStoragePromise') || angular.module('speedshifter.localStoragePromise', []);
	module.provider('localStoragePromise', LocalStorageProvider);
}