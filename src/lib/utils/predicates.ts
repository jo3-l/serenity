import type { Constructor, Thenable } from '#lib/types/shared';

/**
 * Checks whether a value is an object.
 *
 * @param value - Value to check.
 * @returns Whether the value is an object.
 */
export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
	return value !== null && typeof value === 'object';
}

/**
 * Checks whether a value is nullish, aka one of `undefined` or `null`.
 *
 * @param value - Value to check.
 * @returns Whether the value is nullish.
 */
export function isNullish(value: unknown): value is null | undefined {
	return value === undefined || value === null;
}

/**
 * Checks whether a value is a class.
 *
 * @param value - Value to check.
 * @returns Whether the value is a class.
 */
export function isClass(value: unknown): value is Constructor {
	return typeof value === 'function' && isObject(value.prototype);
}

/**
 * Checks whether a class is a subclass of another.
 *
 * @param klass - Class to check.
 * @param superclass - The superclass.
 * @returns Whether `subclass` is a subclass of `superclass`.
 */
export function isSubclassOf<T extends Constructor>(klass: Constructor, superclass: T): klass is T {
	let proto: Constructor | null = klass.prototype;
	while (proto !== null) {
		if (proto === superclass.prototype) return true;
		proto = Object.getPrototypeOf(proto);
	}

	return false;
}

/**
 * Checks whether a value is a 'thenable'. A 'thenable' is an object containing
 * callable `then` and `catch` members.
 *
 * @param value - Value to check.
 * @returns Whether the value is a 'thenable'.
 */
export function isThenable(value: unknown): value is Thenable {
	return isObject(value) && typeof value.then === 'function' && typeof value.catch === 'function';
}
