import type { InferLiteral } from '#lib/types/shared';

/**
 * Represents an empty value.
 */
export interface None {
	exists: false;
}

/**
 * An instance of a None.
 */
export const none: None = { exists: false };

/**
 * Represents an encapsulated value.
 */
export interface Some<T> {
	exists: true;
	value: T;
}

/**
 * Creates a Some from a value.
 *
 * @param value - Value to encapsulate.
 * @returns The encapsulated value.
 */
export function some<T extends InferLiteral[]>(value: [...T]): Some<[...T]>;
export function some<V extends InferLiteral, K extends PropertyKey, T extends { [S in K]: V }>(value: T): Some<T>;
export function some<T extends InferLiteral>(value: T): Some<T>;
export function some<T>(value: T): Some<T>;
export function some<T>(value: T): Some<T> {
	return { exists: true, value };
}

/**
 * An optional value.
 */
export type Maybe<T> = Some<T> | None;

/**
 * Represents a successful computation, containing a value.
 */
export interface Ok<T> {
	ok: true;
	value: T;
}

/**
 * Creates an Ok from a value.
 *
 * @param value - Value of the computation.
 * @returns The resulting Ok.
 */
export function ok<T extends InferLiteral[]>(value: [...T]): Ok<[...T]>;
export function ok<V extends InferLiteral, K extends PropertyKey, R extends { [S in K]: V }>(value: R): Ok<R>;
export function ok<T extends InferLiteral>(value: T): Ok<T>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value: T): Ok<T> {
	return { ok: true, value };
}

/**
 * Represents a failed computation, containing an error value.
 */
export interface Err<E> {
	ok: false;
	error: E;
}

/**
 * Creates an Err from an error value.
 *
 * @param error - Error value to use.
 * @returns The resulting Err.
 */
export function err<E extends InferLiteral[]>(error: [...E]): Err<[...E]>;
export function err<V extends InferLiteral, K extends PropertyKey, E extends { [S in K]: V }>(error: E): Err<E>;
export function err<E extends InferLiteral>(error: E): Err<E>;
export function err<E>(error: E): Err<E>;
export function err<E>(error: E): Err<E> {
	return { ok: false, error };
}

/**
 * An Err with a value of `undefined`.
 */
export const emptyErr: Err<undefined> = { ok: false, error: undefined };

/**
 * A type that represents either success or failure.
 */
export type Result<T, E> = Ok<T> | Err<E>;
