import { emptyOutput, SpecialCharacters } from './PreprocessorOutput';

export class PreprocessorOutputWriter {
	public readonly rawOutput = emptyOutput();

	public readonly leetSpeakDictionary: Map<number, number>;
	public readonly maxWordLeetSpeakPercentage: number;
	public readonly minWordLeetSpeakCount: number;
	public readonly maxWordLeetSpeakCount: number;

	private readonly maxCharacterRunLength: number;
	private readonly maxCharacterRunLengthOverrides: Map<number, number>;
	private readonly maxSymbolRunLength: number;
	private readonly maxWhiteSpaceRunLength: number;

	private lastWrittenAlphanumericCharacter = -1;
	private remainingCharacterWriteCounter = -1;
	private remainingWhiteSpaceWriteCounter: number;
	private remainingSymbolWriteCounter: number;

	private wordBoundaryStartPosition = -1;

	public constructor({
		leetSpeakDictionary,
		maxWordLeetSpeakPercentage,
		minWordLeetSpeakCount,
		maxWordLeetSpeakCount,

		maxCharacterRunLength,
		maxCharacterRunLengthOverrides,
		maxSymbolRunLength,
		maxWhiteSpaceRunLength,
	}: PreprocessorOutputWriterOptions) {
		this.leetSpeakDictionary = leetSpeakDictionary;
		this.maxWordLeetSpeakPercentage = maxWordLeetSpeakPercentage;
		this.minWordLeetSpeakCount = minWordLeetSpeakCount;
		this.maxWordLeetSpeakCount = maxWordLeetSpeakCount;

		this.maxCharacterRunLength = maxCharacterRunLength;
		this.maxCharacterRunLengthOverrides = maxCharacterRunLengthOverrides;
		this.maxSymbolRunLength = maxSymbolRunLength;
		this.maxWhiteSpaceRunLength = maxWhiteSpaceRunLength;

		this.remainingWhiteSpaceWriteCounter = maxWhiteSpaceRunLength;
		this.remainingSymbolWriteCounter = maxSymbolRunLength;
	}

	public writeAlphanumericCharacter(char: number, index: number) {
		const isDifferentCharacter = this.lastWrittenAlphanumericCharacter !== char;
		const shouldWrite =
			isDifferentCharacter || // Last character written is not the same as this one
			this.remainingCharacterWriteCounter > 0; // We have not reached the maximum character run length.
		if (!shouldWrite) return;

		this.rawOutput.characters.push(char);
		this.rawOutput.originalIndices.push(index);

		this.lastWrittenAlphanumericCharacter = char;
		this.resetRemainingSymbolWriteCounter();
		this.resetRemainingWhiteSpaceWriteCounter();

		// If the remaining character write counter was reset or if the
		// character being written is not the same as the last one...
		if (this.remainingCharacterWriteCounter === -1 || isDifferentCharacter) {
			const limit = this.maxCharacterRunLengthOverrides.get(char) ?? this.maxCharacterRunLength;
			// -1 because we just wrote one character.
			this.remainingCharacterWriteCounter = limit - 1;
		} else {
			--this.remainingCharacterWriteCounter;
		}

		if (this.wordBoundaryStartPosition !== -1) {
			// Flush the word boundary span to the output.
			this.rawOutput.wordBoundaryStartIndices.push(this.wordBoundaryStartPosition);
			this.rawOutput.wordBoundaryEndIndices.push(this.position);

			this.wordBoundaryStartPosition = -1;
		}
	}

	public writeWhiteSpace(index: number) {
		if (this.remainingWhiteSpaceWriteCounter <= 0) return;

		this.rawOutput.characters.push(SpecialCharacters.WhiteSpace);
		this.rawOutput.originalIndices.push(index);

		--this.remainingWhiteSpaceWriteCounter;
		this.resetRemainingSymbolWriteCounter();

		// Special characters are all < 0, > 0 must be alphanumeric characters (i.e. part of a word).
		if (this.lastAddedCharacter > 0) this.wordBoundaryStartPosition = this.position;
	}

	public writeSymbol(index: number) {
		if (this.remainingSymbolWriteCounter <= 0) return;

		this.rawOutput.characters.push(SpecialCharacters.Symbol);
		this.rawOutput.originalIndices.push(index);

		--this.remainingSymbolWriteCounter;
		this.resetRemainingWhiteSpaceWriteCounter();

		// Special characters are all < 0, > 0 must be alphanumeric characters (i.e. part of a word).
		if (this.lastAddedCharacter > 0) this.wordBoundaryStartPosition = index;
	}

	private resetRemainingWhiteSpaceWriteCounter() {
		this.remainingWhiteSpaceWriteCounter = this.maxWhiteSpaceRunLength;
	}

	private resetRemainingSymbolWriteCounter() {
		this.remainingSymbolWriteCounter = this.maxSymbolRunLength;
	}

	private get lastAddedCharacter() {
		return this.rawOutput.characters[this.rawOutput.characters.length - 1];
	}

	private get position() {
		return this.rawOutput.characters.length - 1;
	}
}

export interface PreprocessorOutputWriterOptions {
	leetSpeakDictionary: Map<number, number>;
	maxWordLeetSpeakPercentage: number;
	minWordLeetSpeakCount: number;
	maxWordLeetSpeakCount: number;

	maxCharacterRunLength: number;
	maxCharacterRunLengthOverrides: Map<number, number>;
	maxSymbolRunLength: number;
	maxWhiteSpaceRunLength: number;
}
