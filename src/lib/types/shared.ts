/**
 * A type made to be used as a constraint for generic types. It infers as
 * literal a type when possible (using the literal value for primitive types and
 * inferring tuples).
 *
 * In combination with overloads, literal types can be inferred for a variety of
 * values. See the example.
 *
 * @example
 * ```typescript
 * interface Box<T> {
 *  value: T;
 * }
 *
 * function box(value: ImpossibleType): Box<never>;
 * function box<T extends InferLiteral[]>(value: [...T]): Box<[...T]>
 * function box<V extends InferLiteral, K extends PropertyKey, T extends { [S in K]: V }>(value: M): Box<T>;
 * function box<T extends InferLiteral>(value: T): Box<T>;
 * function box<T>(value: T): Box<T>;
 * function box<T>(value: T): Box<T> {
 *  return { value };
 * }
 *
 * box(1); // Box<1>
 * box(['hello world', 1]); // Box<['hello world', 1]>
 * box({ name: 'Beer', cost: 15 }); // Box<{ name: 'Beer', cost: 15 }>
 * ```
 */
export type InferLiteral =
	| string
	| number
	| bigint
	| boolean
	| undefined
	| symbol
	| null
	| undefined
	| readonly []
	| readonly unknown[]
	| []
	| unknown[]
	// eslint-disable-next-line @typescript-eslint/ban-types
	| {};

declare const v: unique symbol;
type UniqueSymbol = typeof v;

/**
 * An 'impossible' type that will never come up in normal code and is extremely
 * hard to replicate. It is meant to be used in combination with `InferLiteral`
 * in a function overload to catch the `never` type. See the example attached to
 * `InferLiteral` for details.
 */
export type ImpossibleType = [[134596 & { [v]: 45677 }, UniqueSymbol, Record<UniqueSymbol, [[never] & { [v]: void }]>]];

/**
 * A utility type that resolves to the constructor type of the class instance
 * type provided.
 */
export type Constructor<T = unknown> = abstract new (...args: any[]) => T;

/**
 * Casts `V` to type `T`.
 */
export type Cast<V, T> = V extends T ? V : T;

/**
 * A type that may or may not be a promise.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Represents a 'thenable', A 'thenable' is an object containing callable `then`
 * and `catch` members.
 */
export interface Thenable {
	// `(...args: any[]) => unknown` does not work if we await a `Thenable` (we
	// get a TS compilation error). Extending `PromiseLike<T>` works, but
	// narrowing types does not work as expected. `Function` seems to be the
	// only type that solves both problems.

	// eslint-disable-next-line @typescript-eslint/ban-types
	then: Function;
	// eslint-disable-next-line @typescript-eslint/ban-types
	catch: Function;
}

/**
 * Marks the property `K` of object `T` as optional.
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes `T` deep readonly.
 */
export type DeepReadonly<T> = T extends any[]
	? DeepReadonlyArray<T[number]>
	: // eslint-disable-next-line @typescript-eslint/ban-types
	T extends object
	? DeepReadonlyObject<T>
	: T;

/**
 * Makes an array of deep readonly values.
 */
export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

/**
 * Marks all the properties of object `T` deep readonly.
 */
export type DeepReadonlyObject<T> = {
	readonly [P in NonFunctionPropertyNames<T>]: DeepReadonly<T[P]>;
};

/**
 * Computes all property names of object `T` that are not functions.
 */
export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => unknown ? never : K;
}[keyof T];
