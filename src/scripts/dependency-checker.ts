/// <reference path="../inc.d.ts" />

module SpeedShifter.Services {
	export interface IDepCheckerOptions {
		expires?: number; // expiration time in ms
		dependent?: string[]; // dependencies, array of strings
	}

	export interface IDepCheckerDepend {
		name: string;
		value: any;
		comparator?: (item1: any, item2: any) => boolean;
	}

	export class DepStorage {
		private storage:{[name:string]: IDepCheckerDepend} = {};
		private global: DepStorage[];
		constructor (...globals: DepStorage[]) {
			this.global = globals;
		}
		setGlobals (...globals: DepStorage[]) {
			this.global = globals;
		}
		addGlobals (...globals: DepStorage[]) {
			return this.global = (this.global || []).concat(globals);
		}
		getGlobals () {
			return this.global;
		}
		getDepend (name: string) {
			if (this.storage[name])
				return this.storage[name];

			if (this.global && this.global.length > 0) {
				var global = this.global, i, dep;
				for (i=global.length-1; i>=0; i--) {
					dep = global[i].getDepend(name);
					if (dep)
						return dep;
				}
			}
			return null;
		}

		isDependentFailed (vals: {[name: string]: any}, deps: string[]) {
			if (!deps)
				return false;
			if (!vals)
				return true;

			var i, name,
				depend;

			for (i=0; i<deps.length; i++) {
				depend = this.getDepend(deps[i]);
				if (!depend
					|| angular.isUndefined(vals[deps[i]])
					|| (depend && !DepStorage.compare(depend, vals[deps[i]]))) { // dependency is required, depStorages doesn't contains it, or vals doesn't so
					return true;
				}
			}
			return false;
		}

		composeDeps (dep: string[]): {[prop: string]: any} {
			if (dep && dep.length > 0) {
				var deps = <{[prop: string]: any}>{},
					i, depend,
					c = 0;
				for (i=0; i<dep.length; i++) {
					depend = this.getDepend(deps[i]);
					if (depend) {
						deps[dep[i]] = depend.value;
						c++;
					}
				}
				if (c>0)
					return deps;
			}
			return null;
		}

		setDependence(dep:ILocalStorageDepend) {
			this.storage[dep.name] = dep;
		}

		removeDependence(name:string) {
			delete this.storage[name];
		}

		clear() {
			delete this.storage;
			this.storage = {};
		}

		setDependenceVal(name:string, val:any) {
			if (this.storage[name])
				this.storage[name].value = val;
			else
				this.storage[name] = <ILocalStorageDepend> {
					name: name,
					value: val
				};
		}

		static compare(dep: IDepCheckerDepend, val) {
			return dep
				&& ((dep.comparator && dep.comparator(dep.value, val))
				|| (dep.value === val)
				|| (angular.isObject(dep.value) && angular.equals(dep.value, val)));
		}
	}

	export class ExpirationChecker {
		static isItemOutdated (time: number, expires: number, now: number = (new Date()).getTime()) {
			if (!expires)
				return false;

			if (!time
				|| (expires && !(angular.isDefined(time) && (now - time < expires)))) {
				return true;
			}
			return false;
		}
		static now () {
			return (new Date()).getTime();
		}
	}

	export interface IDepCheckerItemWrapper {
		time?: number;
		depends?: {[name: string]: any};
	}
	export class DepChecker {
		static isItemInvalid (item: IDepCheckerItemWrapper, options: IDepCheckerOptions, depStorage: DepStorage, now?: number) {
			if (!options)
				return false;

			if (!item
				|| ExpirationChecker.isItemOutdated(item.time, options.expires, now)
				|| (options.dependent && !depStorage)
				|| (depStorage && depStorage.isDependentFailed(item.depends, options.dependent))) {
				return true;
			}
			return false;
		}

		constructor (public options: IDepCheckerOptions, public depStorage?: DepStorage) {

		}
		isItemInvalid (item: IDepCheckerItemWrapper, now?: number) {
			return DepChecker.isItemInvalid(item, this.options, this.depStorage, now);
		}
		setOptions (options: IDepCheckerOptions) {
			this.options = options;
		}
		setDepStorage (depStorage: DepStorage) {
			this.depStorage = depStorage;
		}
	}
}