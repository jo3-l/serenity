import type { FlagMetadata } from './FlagMetadata';
import { Parser } from './Parser';
import type { ParserOutput } from './ParserOutput';
import { emptyOutput } from './ParserOutput';

/**
 * A parser that parses tokens in a relatively standard manner, intended to be
 * used for most cases. It supports flags, options, and ordered arguments.
 *
 * @example
 * ```typescript
 * const tokens = new Lexer()
 * 	.setInput('foo --option optionValue --flag bar')
 * 	.lex();
 *
 * const output = new StandardParser()
 * 	.registerOptions([{ id: 'option', prefixes: ['--option] }])
 * 	.registerFlags([{ id: 'flag', prefixes: ['--flag] }])
 * 	.setInput(tokens)
 * 	.parse();
 *
 * joinTokens(output.ordered); // foo bar
 * output.flags.has('flag'); // true
 * output.options.get('option'); // ['optionValue']
 * ```
 */
export class StandardParser extends Parser {
	/**
	 * Registered flag prefixes, mapped to their IDs.
	 */
	public readonly registeredFlags = new Map<string, string>();

	/**
	 * Registered option prefixes, mapped to their IDs.
	 */
	public readonly registeredOptions = new Map<string, string>();

	/**
	 * Registers flags to be used during parsing.
	 *
	 * @param flags - A list of flag metadata.
	 * @returns The parser.
	 */
	public registerFlags(flags: FlagMetadata[]) {
		for (const { id, prefixes } of flags) {
			for (const prefix of prefixes) this.registeredFlags.set(prefix, id);
		}
		return this;
	}

	/**
	 * Registers the options to be used during parsing.
	 *
	 * @param options - A list of option metadata.
	 * @returns The parser.
	 */
	public registerOptions(options: FlagMetadata[]) {
		for (const { id, prefixes } of options) {
			for (const prefix of prefixes) this.registeredOptions.set(prefix, id);
		}
		return this;
	}

	public next(output = emptyOutput()): IteratorResult<ParserOutput, undefined> {
		if (this.done) return { done: true, value: undefined };

		let ok = this.parseOption(output);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!ok && !this.done) ok = this.parseFlag(output);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!ok && !this.done) this.parseOrdered(output);

		return { done: false, value: output };
	}

	private parseOption(output: ParserOutput) {
		const token = this.input[this.position];
		const optionId = this.registeredOptions.get(token.raw);
		if (!optionId) return undefined;

		this.advance(1);
		// No corresponding value, so discard the option.
		if (this.done) return false;

		const value = this.input[this.position].value;
		const values = output.options.get(optionId);
		if (values) values.push(value);
		else output.options.set(optionId, [value]);

		this.advance(1);
		return true;
	}

	private parseFlag(output: ParserOutput) {
		const token = this.input[this.position];
		const flagId = this.registeredFlags.get(token.raw);
		if (!flagId) return false;

		output.flags.add(flagId);
		this.advance(1);
		return true;
	}

	private parseOrdered(output: ParserOutput) {
		const token = this.input[this.position];
		output.ordered.push(token);
		this.advance(1);
		return true;
	}
}
