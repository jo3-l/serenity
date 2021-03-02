import type { Token } from '../Lexer';
import type { Parser } from './Parser';
import { ParserOutput } from './ParserOutput';

/**
 * A standard parser that is intended to be used in most cases.
 *
 * Given a set of flags and option flags, it parses the list of tokens according
 * to the following general rules:
 *
 * - If a token's raw value is a flag, then add it to the set of flags.
 * - If a token's raw value is an option flag, then append the next token's
 *   value to the option flag data.
 * 	- If the option flag is the last token, then it is discarded.
 * - Otherwise, the token is added to the list of ordered arguments.
 */
export class StandardParser implements Parser {
	private readonly registeredFlags = new Map<string, string>();
	private readonly registeredOptionFlags = new Map<string, string>();

	/**
	 * Sets the flags to be used during parsing.
	 *
	 * @param flags - Flag options.
	 * @returns The parser.
	 */
	public setFlags(flags: FlagOptions[]) {
		for (const { id, prefixes } of flags) {
			for (const prefix of prefixes) this.registeredFlags.set(prefix, id);
		}
		return this;
	}

	/**
	 * Sets the option flags to be used during parsing.
	 *
	 * @param flags - Flag options.
	 * @returns The parser.
	 */
	public setOptionFlags(flags: FlagOptions[]) {
		for (const { id, prefixes } of flags) {
			for (const prefix of prefixes) this.registeredOptionFlags.set(prefix, id);
		}
		return this;
	}

	public parse(tokens: Token[]) {
		const output = new ParserOutput();
		let i = 0;
		while (i < tokens.length) {
			const token = tokens[i];

			const optionFlagId = this.registeredOptionFlags.get(token.raw);
			if (optionFlagId) {
				// If there's a token after the current one:
				if (i + 1 < tokens.length) {
					const value = tokens[i + 1].value;

					// Add it to the values of this option flag.
					const values = output.optionFlags.get(optionFlagId);
					if (values) values.push(value);
					else output.optionFlags.set(optionFlagId, [value]);

					// Skip past the option flag and its value.
					i += 2;
				} else {
					// Discard the option flag, as it doesn't have a value.
					++i;
				}

				continue;
			}

			const flagId = this.registeredFlags.get(token.raw);
			if (flagId) {
				output.flags.add(flagId);
				++i;
				continue;
			}

			output.unordered.push(token.value);
			++i;
		}

		return output;
	}
}

/**
 * Options for flags.
 */
export interface FlagOptions {
	/**
	 * The ID of this flag. This will be the value added to
	 * `ParserOutput#flags`.
	 */
	id: string;

	/**
	 * The prefixes of this flag. If a token's raw value is a member of this
	 * list, then it will be interpreted as a flag.
	 */
	prefixes: string[];
}
