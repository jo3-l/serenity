// TODO: Implement applyOptions()
export function applyOptions() {
	throw new Error();
}

/**
 * A decorator that auto-binds a method to its class instance.
 *
 * @remarks
 * This is taken from
 * [NoHomey/bind-decorator](https://github.com/NoHomey/bind-decorator), which is
 * under the MIT License.
 *
 * Copyright (c) 2016 Ivo Stratev.
 */
export function autobind<T extends (...args: readonly unknown[]) => unknown>(
	_target: unknown,
	propertyKey: string | symbol,
	descriptor?: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> {
	if (typeof descriptor?.value !== 'function') {
		throw new TypeError(
			'Attempted to decorate a value which was not a method using `@autobind`. This is not supported.',
		);
	}

	return {
		configurable: true,
		get(this: T) {
			const bound = descriptor.value!.bind(this) as T;
			Reflect.defineProperty(this, propertyKey, {
				value: bound,
				configurable: true,
				writable: true,
			});
			return bound;
		},
	};
}
