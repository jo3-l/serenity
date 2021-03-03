import type { Token } from '../Token';
import type { Parser } from './Parser';
import { ParserOutput } from './ParserOutput';

/**
 * A standard parser intended to be used in most cases.
 *
 * Given a set of flags and options, it parses the list of tokens according to
 * the following general rules:
 *
 * - If a token's raw value is a flag, then add it to the set of flags.
 * - If a token's raw value is an option prefix, then append the next token's
 *   value to the option's values.
 *  - If the option prefix is the last token, then it is discarded.
 * - Otherwise, the token is added to the list of ordered arguments.
 */
export class StandardParser implements Parser {
	private readonly registeredFlags = new Map<string, string>();
	private readonly registeredOptions = new Map<string, string>();

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
		const output = new ParserOutput();

		let i = 0;
		while (i < tokens.length) {
			const token = tokens[i];

			const optionId = this.registeredOptions.get(token.raw);
			if (optionId) {
				// If this is the last token, discard it as all options must have values.
				if (i === tokens.length - 1) break;

				const value = tokens[i + 1].value;

				const values = output.options.get(optionId);
				if (values) values.push(value);
				else output.options.set(optionId, [value]);

				i += 2;
				continue;
			}

			const flagId = this.registeredFlags.get(token.raw);
			if (flagId) output.flags.add(flagId);
			else output.ordered.push(token.value);

			i += 1;
		}

		return output;
	}
}

/**
 * Metadata for flags or options.
 */
export interface FlagMetadata {
	/**
	 * The ID of this flag.
	 */
	id: string;

	/**
	 * The prefixes of this flag. For example, given that this is `['--help',
	 * '-h']`, both `-h` and `--help` would be recognized as flags of this type.
	 */
	prefixes: string[];
}
