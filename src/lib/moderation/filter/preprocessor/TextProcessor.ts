import { CharacterIterator } from './CharacterIterator';

import { getCode, isWhiteSpace } from '@skyra/char';

const PIPE_CODEPOINT = getCode('|');

export class TextPreprocessor {
	private readonly maxWordLeetSpeakPercentage: number;
	private readonly minWordLeetSpeak: number;
	private readonly maxWordLeetSpeak: number;
	private readonly leetSpeakDictionary = new Map<number, number>();

	private readonly maxCharacterRunLength: number;
	private readonly maxCharacterRunLengthOverrides = new Map<number, number>();
	private readonly maxSymbolRunLength: number;
	private readonly maxWhiteSpaceRunLength: number;

	private readonly symbolCharacters?: Set<number>;
	private readonly blankCharacters?: Set<number>;
	private readonly spaceCharacters?: Set<number>;

	public constructor({
		leetSpeakDictionary,
		maxWordLeetSpeakPercentage,
		minWordLeetSpeakCount: minWordLeetSpeak,
		maxWordLeetSpeakCount: maxWordLeetSpeak,

		maxCharacterRunLength,
		maxCharacterRunLengthOverrides,
		maxSymbolRunLength,
		maxWhiteSpaceRunLength,

		symbolCharacters,
		blankCharacters,
		whiteSpaceCharacters: spaceCharacters,
	}: TextPreprocessorOptions) {
		for (const [base, aliases] of Object.entries(leetSpeakDictionary)) {
			const originalCodePoint = getCode(base);
			for (const alias of aliases) {
				const aliasCodePoint = getCode(alias);
				this.leetSpeakDictionary.set(originalCodePoint, aliasCodePoint);
			}
		}

		this.maxWordLeetSpeakPercentage = maxWordLeetSpeakPercentage;
		this.minWordLeetSpeak = minWordLeetSpeak;
		this.maxWordLeetSpeak = maxWordLeetSpeak;

		this.maxCharacterRunLength = maxCharacterRunLength;
		if (maxCharacterRunLengthOverrides) {
			for (const [char, count] of Object.entries(maxCharacterRunLengthOverrides)) {
				const codePoint = getCode(char);
				this.maxCharacterRunLengthOverrides.set(codePoint, count);
			}
		}
		this.maxSymbolRunLength = maxSymbolRunLength;
		this.maxWhiteSpaceRunLength = maxWhiteSpaceRunLength;

		if (symbolCharacters) this.symbolCharacters = new Set([...symbolCharacters].map(getCode));
		if (blankCharacters) this.blankCharacters = new Set([...blankCharacters].map(getCode));
		if (spaceCharacters) this.spaceCharacters = new Set([...spaceCharacters].map(getCode));
	}

	public run(input: string) {
		const normalized = input.normalize('NFKD');

		let i = 0;
		for (; i < normalized.length; i++) {
			const char = normalized.charCodeAt(i);
			// Characters with a code less than or equal to 126 are members of
			// the ASCII character set, used in a huge majority of
			// conversations. They require very little processing - we can skip
			// attempting to match confusable characters and also skip stripping
			// combining marks. There is only one exception, the pipe character
			// '|': we consider it to be a confusable character for 'L'.
			if (char > 126 || char === PIPE_CODEPOINT) break;
		}
	}
}

export interface TextPreprocessorOptions {
	leetSpeakDictionary: Record<string, string>;
	maxWordLeetSpeakPercentage: number;
	minWordLeetSpeakCount: number;
	maxWordLeetSpeakCount: number;

	maxCharacterRunLength: number;
	maxCharacterRunLengthOverrides?: Record<string, number>;
	maxSymbolRunLength: number;
	maxWhiteSpaceRunLength: number;

	symbolCharacters?: Iterable<string>;
	blankCharacters?: Iterable<string>;
	whiteSpaceCharacters?: Iterable<string>;
}
