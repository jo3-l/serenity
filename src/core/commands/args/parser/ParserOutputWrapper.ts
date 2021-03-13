import type { Maybe, Result } from '#utils/monads';
import { err, none } from '#utils/monads';

import type { Token } from '../tokens';
import type { ParserOutput } from './ParserOutput';

/**
 * A wrapper around the parser output, providing helpers for keeping state and
 * accessing data.
 */
export class ParserOutputWrapper {
	/**
	 * The parser output.
	 */
	public readonly parserOutput: ParserOutput;

	private state: WrapperState;
	private savedState?: WrapperState;

	/**
	 * Creates a new parser output wrapper.
	 *
	 * @param parserOutput - Parser output to use.
	 */
	public constructor(parserOutput: ParserOutput) {
		this.parserOutput = parserOutput;
		this.state = {
			usedIndices: new Set(),
			position: 0,
			positionFromEnd: parserOutput.ordered.length - 1,
		};
	}

	/**
	 * Whether the wrapper is done with the ordered tokens.
	 */
	public get done() {
		return this.state.usedIndices.size >= this.length;
	}

	/**
	 * The total number of ordered tokens.
	 */
	public get length() {
		return this.parserOutput.ordered.length;
	}

	/**
	 * The current position in the ordered tokens.
	 */
	public get position() {
		return this.state.position;
	}

	/**
	 * The current position in the ordered tokens, starting from the opposite
	 * end.
	 */
	public get positionFromEnd() {
		return this.state.positionFromEnd;
	}

	/**
	 * Checks whether a flag was provided in the input..
	 *
	 * @param id - ID of the flag to check.
	 * @returns `true` if the flag is present, otherwise `false`.
	 */
	public hasFlag(id: string) {
		return this.parserOutput.flags.has(id);
	}

	/**
	 * Gets the values of an option.
	 *
	 * @param id - ID of the option.
	 * @param all - Whether all values should be returned rather than only the
	 * last one. Defaults to `false`.
	 * @returns All the values of the option as an array if `all` is true,
	 * otherwise, only the last one is returned. If the option has no values,
	 * `undefined` is returned.
	 */
	public getOption<TRetrieveAll>(
		id: string,
		all: TRetrieveAll = false as any,
	): (TRetrieveAll extends true ? string[] : string) | undefined {
		const values = this.parserOutput.options.get(id);
		if (!values?.length) return undefined;

		// @ts-expect-error - TypeScript cannot infer that this is of the correct return type :(
		return all ? values : values[values.length - 1];
	}

	/**
	 * Retrieves the next unused token's value.
	 *
	 * @param fromEnd - Whether to retrieve from the end rather than the start.
	 * Defaults to `false`.
	 * @returns The next ordered token's value.
	 */
	public nextOrdered(fromEnd = false) {
		if (this.done) return undefined;

		if (fromEnd) {
			while (this.state.usedIndices.has(this.state.positionFromEnd)) {
				--this.state.positionFromEnd;
			}
			this.markAsUsed(this.state.positionFromEnd);
			return this.parserOutput.ordered[this.state.positionFromEnd--].value;
		}

		const token = this.nextToken()!;
		this.markAsUsed();
		++this.state.position;
		return token.value;
	}

	/**
	 * Retrieves a number of tokens from either the start or end of the list,
	 * with a configurable limit and start position. The tokens will now be
	 * considered used.
	 *
	 * @param options - Options to use.
	 * @returns A list of tokens.
	 */
	public retrieveMany({
		fromEnd = false,
		limit = Infinity,
		startPosition = fromEnd ? this.state.positionFromEnd : this.state.position,
	}: RetrieveManyOptions = {}) {
		if (this.done) return [];

		const tokens: Token[] = [];
		if (fromEnd) {
			for (let i = startPosition; i >= 0; i--) {
				if (this.state.usedIndices.has(i)) continue;

				this.markAsUsed(i);
				tokens.push(this.parserOutput.ordered[i]);
				if (tokens.length === limit) break;
			}

			// Since we use `tokens.push` in the loop, our list of tokens is
			// actually currently reversed (the tokens with higher indices are
			// at the front). Therefore, we reverse the list of tokens in place
			// before returning it.
			//
			// Note that we do not use `tokens.unshift` in the loop. While that
			// appends to the front of the array, it has linear time complexity.
			// When called in a loop, this results in `O(n^2)` complexity which
			// is less than optimal.
			return tokens.reverse();
		}

		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			this.markAsUsed(i);
			tokens.push(this.parserOutput.ordered[i]);
			if (tokens.length === limit) break;
		}

		return tokens;
	}

	/**
	 * Applies a function to the next unused token. The token will now be
	 * considered used.
	 *
	 * @param fn - Returns a `Maybe` of either of the resulting value, or
	 * nothing if it did not succeed.
	 * @param alwaysUse - Whether the token should be marked as used regardless
	 * of whether the transformation succeeded. Defaults to false.
	 * @returns A `Maybe` of either the resulting value, or nothing if it did
	 * not succeed. If there are no tokens left, undefined is returned.
	 */
	public mapNext<T>(fn: (value: string) => Maybe<T>, alwaysUse = false) {
		if (this.done) return undefined;

		const token = this.nextToken()!;
		const result = fn(token.value);

		if (alwaysUse || result.exists) {
			this.markAsUsed();
			++this.state.position;
		}
		return result;
	}

	/**
	 * A variant of `mapNext` that accepts an asynchronous mapper function.
	 *
	 * @param fn - Returns a `Maybe` of either of the resulting value, or
	 * nothing if it did not succeed.
	 * @param alwaysUse - Whether the token should be marked as used regardless
	 * of whether the transformation succeeded. Defaults to false.
	 * @returns A `Maybe` of either the resulting value, or nothing if it did
	 * not succeed. If there are no tokens left, undefined is returned.
	 */
	public async mapNextAsync<T>(fn: (value: string) => Promise<Maybe<T>>, alwaysUse = false) {
		if (this.done) return undefined;

		const token = this.nextToken()!;
		const result = await fn(token.value);

		if (alwaysUse || result.exists) {
			this.markAsUsed();
			++this.state.position;
		}
		return result;
	}

	/**
	 * Parses the next unused token. The token will now be considered used.
	 *
	 * @param fn - Returns a `Result` of either of the resulting value, or the
	 * error if it did not succeed.
	 * @param alwaysUse - Whether the token should be marked as used regardless
	 * of whether the transformation succeeded. Defaults to false.
	 * @returns A `Result` of either the resulting value, or the error if it did
	 * not succeed. If there are no tokens left, undefined is returned.
	 */
	public parseNext<T, E>(fn: (value: string) => Result<T, E>, alwaysUse = false) {
		if (this.done) return undefined;

		const token = this.nextToken()!;
		const result = fn(token.value);

		if (alwaysUse || result.ok) {
			this.markAsUsed();
			++this.state.position;
		}
		return result;
	}

	/**
	 * A variant of `parseNext` that accepts an asynchronous function.
	 *
	 * @param fn - Returns a `Result` of either of the resulting value, or the
	 * error if it did not succeed.
	 * @param alwaysUse - Whether the token should be marked as used regardless
	 * of whether the transformation succeeded. Defaults to false.
	 * @returns A `Result` of either the resulting value, or the error if it did
	 * not succeed. If there are no tokens left, undefined is returned.
	 */
	public async parseNextAsync<T, E>(fn: (value: string) => Promise<Result<T, E>>, alwaysUse = false) {
		if (this.done) return undefined;

		const token = this.nextToken()!;
		const result = await fn(token.value);

		if (alwaysUse || result.ok) {
			this.markAsUsed();
			++this.state.position;
		}
		return result;
	}

	/**
	 * Transforms unused tokens until the transformation fails. The tokens will
	 * now be considered used.
	 *
	 * @param fn - Returns a `Maybe` of either the resulting value, or nothing
	 * if it did not succeed.
	 * @param options - Options to use.
	 * @returns The resulting values.
	 */
	public mapWhile<T>(
		fn: (value: string) => Maybe<T>,
		{ alwaysUse = false, limit = Infinity, startPosition = this.state.position }: TransformManyOptions = {},
	) {
		if (this.done) return [];
		const mapped: T[] = [];
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = fn(token.value);

			if (alwaysUse || result.exists) this.markAsUsed(i);
			if (!result.exists) return mapped;

			mapped.push(result.value);
			if (mapped.length === limit) return mapped;
		}

		return mapped;
	}

	/**
	 * Transforms unused tokens until the transformation fails. The tokens will
	 * now be considered used.
	 *
	 * @param fn - Returns a `Maybe` of either the resulting value, or nothing
	 * if it did not succeed.
	 * @param options - Options to use.
	 * @returns The resulting values.
	 */
	public async mapWhileAsync<T>(
		fn: (value: string) => Promise<Maybe<T>>,
		{ alwaysUse = false, limit = Infinity, startPosition = this.state.position }: TransformManyOptions = {},
	) {
		if (this.done) return [];
		const mapped: T[] = [];
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = await fn(token.value);

			if (alwaysUse || result.exists) this.markAsUsed(i);
			if (!result.exists) return mapped;

			mapped.push(result.value);
			if (mapped.length === limit) return mapped;
		}

		return mapped;
	}

	/**
	 * Finds and retrieves the first unused token that could be transformed. The
	 * token will now be considered used.
	 *
	 * @param fn - Returns a `Maybe` of either the resulting value, or nothing
	 * if it did not succeed.
	 * @param options - Options to use.
	 * @returns A `Maybe` of either the resulting value, or nothing if it was
	 * not found.
	 */
	public findMap<T>(
		fn: (value: string) => Maybe<T>,
		{ alwaysUse = false, startPosition = this.state.position }: Omit<TransformManyOptions, 'limit'> = {},
	): Maybe<T> {
		if (this.done) return none;
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = fn(token.value);

			if (alwaysUse || result.exists) this.markAsUsed(i);
			if (result.exists) return result;
		}

		return none;
	}

	/**
	 * A variant of `findMap` that accepts an asynchronous function.
	 *
	 * @param fn - Returns a `Maybe` of either the resulting value, or nothing
	 * if it did not succeed.
	 * @param options - Options to use.
	 * @returns A `Maybe` of either the resulting value, or nothing if it was
	 * not found.
	 */
	public async findMapAsync<T>(
		fn: (value: string) => Promise<Maybe<T>>,
		{ alwaysUse = false, startPosition = this.state.position }: Omit<TransformManyOptions, 'limit'> = {},
	): Promise<Maybe<T>> {
		if (this.done) return none;
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = await fn(token.value);

			if (alwaysUse || result.exists) this.markAsUsed(i);
			if (result.exists) return result;
		}

		return none;
	}

	/**
	 * Finds and retrieves the first unused token that could be transformed. The
	 * token will now be considered used.
	 *
	 * @param fn - Returns a `Result` of either the resulting value, or the
	 * error if it did not succeed.
	 * @param options - Options to use.
	 * @returns A `Result` of either the resulting value, or a list of errors
	 * during parsing.
	 */
	public findParse<T, E>(
		fn: (value: string) => Result<T, E>,
		{ alwaysUse = false, startPosition = this.state.position }: Omit<TransformManyOptions, 'limit'> = {},
	): Result<T, E[]> {
		if (this.done) return err([]);

		const errors: E[] = [];
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = fn(token.value);

			if (alwaysUse || result.ok) this.markAsUsed(i);
			if (result.ok) return result;

			errors.push(result.error);
		}

		return err(errors);
	}

	/**
	 * A variant of `findParse` that accepts an asynchronous function.
	 *
	 * @param fn - Returns a `Result` of either the resulting value, or the
	 * error if it did not succeed.
	 * @param options - Options to use.
	 * @returns A `Result` of either the resulting value, or a list of errors
	 * during parsing.
	 */
	public async findParseAsync<T, E>(
		fn: (value: string) => Promise<Result<T, E>>,
		{ alwaysUse = false, startPosition = this.state.position }: Omit<TransformManyOptions, 'limit'> = {},
	): Promise<Result<T, E[]>> {
		if (this.done) return err([]);

		const errors: E[] = [];
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = await fn(token.value);

			if (alwaysUse || result.ok) this.markAsUsed(i);
			if (result.ok) return result;

			errors.push(result.error);
		}

		return err(errors);
	}

	/**
	 * Finds and retrieves all unused tokens that could be transformed. The
	 * tokens will now be considered used.
	 *
	 * @param fn - Returns a `Maybe` of either the resulting value, or nothing
	 * if it did not succeed.
	 * @param options - Options to use.
	 * @returns A list of all resulting values.
	 */
	public filterMap<T>(
		fn: (value: string) => Maybe<T>,
		{ alwaysUse = false, limit = Infinity, startPosition = this.state.position }: TransformManyOptions = {},
	) {
		if (this.done) return [];

		const values: T[] = [];
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = fn(token.value);

			if (alwaysUse || result.exists) this.markAsUsed(i);
			if (result.exists) values.push(result.value);

			if (values.length === limit) return values;
		}

		return values;
	}

	/**
	 * A variant of `filterMap` that accepts an asynchronous function.
	 *
	 * @param fn - Returns a `Maybe` of either the resulting value, or nothing
	 * if it did not succeed.
	 * @param options - Options to use.
	 * @returns A list of all resulting values.
	 */
	public async filterMapAsync<T>(
		fn: (value: string) => Promise<Maybe<T>>,
		{ alwaysUse = false, limit = Infinity, startPosition = this.state.position }: TransformManyOptions = {},
	) {
		if (this.done) return [];

		const values: T[] = [];
		for (let i = startPosition; i < this.length; i++) {
			if (this.state.usedIndices.has(i)) continue;

			const token = this.parserOutput.ordered[i];
			const result = await fn(token.value);

			if (alwaysUse || result.exists) this.markAsUsed(i);
			if (result.exists) values.push(result.value);

			if (values.length === limit) return values;
		}

		return values;
	}

	/**
	 * Marks a position as used.
	 *
	 * @param position - Position to mark as used. Defaults to the current
	 * position in the forward direction.
	 */
	public markAsUsed(position = this.state.position) {
		this.state.usedIndices.add(position);
	}

	/**
	 * Saves the current state.
	 */
	public save() {
		const clonedState = { ...this.state };
		// Spread operator results in a shallow clone, so `usedIndices` still
		// points to the original value.
		clonedState.usedIndices = new Set(clonedState.usedIndices);

		this.savedState = clonedState;
	}

	/**
	 * Resets this output wrapper to the most recent saved state. The saved
	 * state will be cleared after the reset is complete. If there is no saved
	 * state, this method does nothing.
	 */
	public reset() {
		if (!this.savedState) return;
		this.state = this.savedState;
		this.savedState = undefined;
	}

	private nextToken() {
		/* istanbul ignore next - Private method */
		if (this.done) return undefined;
		while (this.state.usedIndices.has(this.state.position)) ++this.state.position;
		return this.parserOutput.ordered[this.state.position];
	}
}

/**
 * Options for `retrieveMany`.
 */
export interface RetrieveManyOptions {
	/**
	 * Whether the tokens should be retrieved starting from the end rather than
	 * the start.
	 *
	 * @default false
	 */
	fromEnd?: boolean;

	/**
	 * The maximum number of tokens to retrieve.
	 *
	 * @default Infinity
	 */
	limit?: number;

	/**
	 * The position to start searching for tokens at. Defaults to the current
	 * position from the start/end, depending on the value of `fromEnd`.
	 */
	startPosition?: number;
}

/**
 * Options for methods that operate on many tokens, such as `mapWhile`,
 * `parseWhile`, and `findMap`.
 */
export interface TransformManyOptions {
	/**
	 * Whether to mark the token as used regardless of whether the
	 * transformation succeeded.
	 *
	 * @default false
	 */
	alwaysUse?: boolean;

	/**
	 * The maximum number of tokens to transform before returning.
	 *
	 * @default Infinity
	 */
	limit?: number;

	/**
	 * The position to start searching for tokens at.
	 *
	 * @default this.state.position
	 */
	startPosition?: number;
}

interface WrapperState {
	usedIndices: Set<number>;
	position: number;
	positionFromEnd: number;
}
