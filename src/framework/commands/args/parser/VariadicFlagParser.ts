import type { FlagMetadata } from './FlagMetadata';
import { Parser } from './Parser';
import { ParserOutput } from './ParserOutput';

/**
 * A parser made to handle input that is made up of only flags and options. It
 * allows you to specify multi-word values for option flags without using
 * quotes (for example, given `--option my option value`, `option` would have
 * the value `my option value` instead of just `my`). Note that a major caveat
 * is that it does not parse ordered arguments.
 *
 * @example
 * ```typescript
 * const tokens = new Lexer()
 * 	.setInput('--option hello world --otherOption foo bar')
 * 	.lex();
 *
 * const output = new VariadicFlagParser()
 * 	.registerOptions([
 * 		{ id: 'option', prefixes: ['--option] },
 * 		{ id: 'otherOption', prefixes: ['--otherOption'] },
 * 	])
 * 	.setInput(tokens)
 * 	.parse();
 *
 * output.options.get('option'); // ['hello world']
 * output.options.get('otherOption'); // ['foo bar']
 * ```
 */
export class VariadicFlagParser extends Parser {
	private readonly registeredFlags = new Map<string, string>();
	private readonly registeredOptions = new Map<string, string>();

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
	 * Registers options to be used during parsing.
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

	public next(output = new ParserOutput()): IteratorResult<ParserOutput> {
		if (this.done) return { done: true, value: undefined };

		let ok = this.parseOption(output);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!ok && !this.done) ok = this.parseFlag(output);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!ok && !this.done) {
			// The current argument isn't a flag or option, so we discard it.
			this.advance(1);
		}

		return { done: false, value: output };
	}

	private parseOption(output: ParserOutput) {
		const firstToken = this.input[this.position];
		const optionId = this.registeredOptions.get(firstToken.raw);
		if (!optionId) return undefined;

		this.advance(1);
		// No corresponding value, so discard the option.
		if (this.done) return false;

		// Always add the token immediately after the option to its value.
		let token = this.input[this.position];
		let value = token.value + token.trailing;

		this.advance(1);
		while (!this.done) {
			token = this.input[this.position];
			// The option's value ends when it reaches another flag or option.
			if (this.registeredFlags.has(token.raw) || this.registeredOptions.has(token.raw)) break;

			value += token.value + token.trailing;
			this.advance(1);
		}

		const values = output.options.get(optionId);
		if (values) values.push(value);
		else output.options.set(optionId, [value]);

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
}
