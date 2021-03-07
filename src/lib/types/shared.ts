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
