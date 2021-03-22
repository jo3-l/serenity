import { CharacterIterator } from './CharacterIterator';
import { PreprocessorOutputWriter } from './PreprocessorOutputWriter';

import { getCode, getUnicodeCategory, isAscii, UnicodeCategory } from '@skyra/char';

const VERTICAL_LINE = getCode('|');

const LOWERCASE_A = getCode('a');
const LOWERCASE_Z = getCode('z');

const UPPERCASE_A = getCode('A');
const UPPERCASE_Z = getCode('Z');

export class TextPreprocessor {
	private readonly leetSpeakDictionary = new Map<number, number>();
	private readonly multiCharacterConfusables = new Map<number, number[]>();
	private readonly singleCharacterConfusables = new Map<number, number>();

	private readonly outputWriter: PreprocessorOutputWriter;
	private readonly inputIterator = new CharacterIterator();

	public constructor({
		leetSpeakDictionary,
		confusableCharacterDictionary,
		maxCharacterRunLength,
		maxCharacterRunLengthOverrides,
	}: TextPreprocessorOptions) {
		for (const [base, aliases] of Object.entries(leetSpeakDictionary)) {
			const originalCodePoint = getCode(base);
			for (const alias of aliases) {
				const aliasCodePoint = getCode(alias);
				this.leetSpeakDictionary.set(originalCodePoint, aliasCodePoint);
			}
		}

		for (const [base, aliases] of confusableCharacterDictionary) {
			// If the base character is more than 1 Unicode code unit in length:
			if ([...base].length > 1) {
				const baseCodes: number[] = [];
				for (const char of base) {
					const charCode = getCode(char);
					const normalizedCharCode = this.leetSpeakDictionary.get(charCode) ?? charCode;

					baseCodes.push(normalizedCharCode);
				}

				for (const alias of aliases) {
					const aliasCode = getCode(alias);
					this.multiCharacterConfusables.set(aliasCode, baseCodes);
				}

				continue;
			}

			const baseCode = getCode(base);
			const normalizedBaseCode = this.leetSpeakDictionary.get(baseCode) ?? baseCode;

			for (const alias of aliases) {
				const aliasCode = getCode(alias);
				this.singleCharacterConfusables.set(aliasCode, normalizedBaseCode);
			}
		}

		const resolvedMaxCharacterRunLengthOverrides = new Map<number, number>();
		if (maxCharacterRunLengthOverrides) {
			for (const [char, count] of Object.entries(maxCharacterRunLengthOverrides)) {
				const codePoint = getCode(char);
				resolvedMaxCharacterRunLengthOverrides.set(codePoint, count);
			}
		}

		this.outputWriter = new PreprocessorOutputWriter({
			maxCharacterRunLength,
			maxCharacterRunLengthOverrides: resolvedMaxCharacterRunLengthOverrides,
		});
	}

	public run(input: string) {
		this.outputWriter.reset();
		const normalized = input.trim().normalize('NFKD');

		let i = 0;
		for (; i < normalized.length; i++) {
			const char = normalized.charCodeAt(i);
			// We consider the vertical line character '|' to be a confusable
			// character for 'L'.
			if (char === VERTICAL_LINE || !isAscii(char)) break;
			this.processCharFast(char, i);
		}

		// If `i` is not equal to the length of the string, then the loop above
		// stopped early due to a character not being ASCII. We now have to take
		// the slow path.
		if (i !== normalized.length) {
			this.inputIterator.setPosition(i);
			for (const char of this.inputIterator) this.processChar(char, this.inputIterator.position);
		}
	}

	private processCharFast(char: number, index: number) {
		// If the character is an uppercase letter, flip the 5th bit to convert
		// it to lower-case.
		if (UPPERCASE_A <= char && char <= UPPERCASE_Z) char ^= 0x20;
		if (LOWERCASE_A <= char && char <= LOWERCASE_Z) return this.outputWriter.writeAlphaCharacter(char, index);

		// Check for leet-speak characters.
		const leetSpeakChar = this.leetSpeakDictionary.get(char);
		if (leetSpeakChar) return this.outputWriter.writeAlphaCharacter(leetSpeakChar, index);

		// All other characters are interpreted as separator characters.
		this.outputWriter.writeSeparator();
	}

	private processChar(char: number, index: number) {
		// If the character is an uppercase letter, flip the 5th bit to convert
		// it to lower-case.
		if (UPPERCASE_A <= char && char <= UPPERCASE_Z) char ^= 0x20;
		if (LOWERCASE_A <= char && char <= LOWERCASE_Z) return this.outputWriter.writeAlphaCharacter(char, index);

		// Check for confusable characters.
		const singleCharacterConfusable = this.singleCharacterConfusables.get(char);
		if (singleCharacterConfusable) return this.outputWriter.writeAlphaCharacter(singleCharacterConfusable, index);

		const multiCharacterConfusable = this.multiCharacterConfusables.get(char);
		if (multiCharacterConfusable) {
			for (const char of multiCharacterConfusable) this.outputWriter.writeAlphaCharacter(char, index);
			return;
		}

		// Check for leet-speak characters.
		const leetSpeakChar = this.leetSpeakDictionary.get(char);
		if (leetSpeakChar) return this.outputWriter.writeAlphaCharacter(leetSpeakChar, index);

		// Otherwise, get the Unicode category that this character falls into
		// and either do nothing or write a separator character.
		const category = getUnicodeCategory(char);
		switch (category) {
			case UnicodeCategory.Control:
			case UnicodeCategory.Format:
			case UnicodeCategory.SpacingCombiningMark:
			case UnicodeCategory.EnclosingMark:
			case UnicodeCategory.NonSpacingMark:
				// Completely ignore characters in these categories.
				return;
			default:
				this.outputWriter.writeSeparator();
		}
	}
}

export interface TextPreprocessorOptions {
	leetSpeakDictionary: Record<string, string>;
	confusableCharacterDictionary: Map<string, string>;
	maxCharacterRunLength: number;
	maxCharacterRunLengthOverrides?: Record<string, number>;
}
