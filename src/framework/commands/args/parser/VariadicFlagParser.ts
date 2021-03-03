import type { Token } from '../Token';
import type { Parser } from './Parser';
import { ParserOutput } from './ParserOutput';
import type { FlagMetadata } from './StandardParser';

/**
 * A parser intended to handle the case of when input is only expected to be
 * made up of flags and option flags. For example, the following input:
 *
 * `--option hello world --foo bar baz`
 *
 * would result in the `--option` flag having a value of `hello world` and
 * `--foo` flag having a value of `bar baz`, instead of `hello` and `bar`
 * respectively (the result from using the `StandardParser`).
 *
 * In other words, this allows you to specify multi-word values for option flags
 * without using quotes, but does not allow positional arguments or empty
 * strings as values (`""` would be interpreted literally).
 */
export class VariadicFlagParser implements Parser {
	private readonly registeredFlags = new Map<string, string>();
	private readonly registeredOptions = new Map<string, string>();
	private tokens: Token[] = [];
	private position = 0;

	/**
	 * Sets the flags to be used during parsing.
	 *
	 * @param flags - A list of flag metadata.
	 * @returns The parser.
	 */
	public setFlags(flags: FlagMetadata[]) {
		for (const { id, prefixes } of flags) {
			for (const prefix of prefixes) this.registeredFlags.set(prefix, id);
		}
		return this;
	}

	/**
	 * Sets the options to be used during parsing.
	 *
	 * @param options - A list of option metadata.
	 * @returns The parser.
	 */
	public setOptions(options: FlagMetadata[]) {
		for (const { id, prefixes } of options) {
			for (const prefix of prefixes) this.registeredOptions.set(prefix, id);
		}
		return this;
	}

	public parse(tokens: Token[]) {
		this.reset();
		this.tokens = tokens;

		const output = new ParserOutput();
		while (!this.done) {
			const token = tokens[this.position];

			const optionId = this.registeredOptions.get(token.value);
			if (optionId) {
				const value = this.nextValue();
				// If the option does not have a value, it is invalid and should
				// be discarded.
				if (!value) continue;

				const values = output.options.get(optionId);
				if (values) values.push(value);
				else output.options.set(optionId, [value]);

				continue;
			}

			const flagId = this.registeredFlags.get(token.value);
			if (flagId) output.flags.add(flagId);

			this.advance(1);
		}

		return output;
	}

	private get done() {
		return this.position <= this.tokens.length;
	}

	private reset() {
		this.position = 0;
	}

	private advance(n: number) {
		this.position += n;
	}

	private nextValue() {
		// If the current token is the last one, return `undefined`.
		if (this.position === this.tokens.length - 1) return undefined;

		// Add the first token's value to the buffer.
		const firstToken = this.tokens[this.position + 1];
		let buffer = firstToken.raw + firstToken.trailing;

		this.advance(1);
		while (!this.done) {
			const token = this.tokens[this.position];
			const isFlagOrOption = this.registeredOptions.has(token.raw) || this.registeredFlags.has(token.raw);
			// The value ends when we reach a flag or option.
			if (isFlagOrOption) return buffer;

			// Otherwise, add the token's value to the buffer, and move on to the next one.
			buffer += firstToken.raw + firstToken.trailing;
			this.advance(1);
		}

		return buffer;
	}
}
