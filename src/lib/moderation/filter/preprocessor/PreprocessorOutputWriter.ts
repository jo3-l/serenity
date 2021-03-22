import type { ReadonlyTextPreprocessorOutput } from './PreprocessorOutput';
import { emptyOutput } from './PreprocessorOutput';

/**
 * An abstraction for managing preprocessor output.
 */
export class PreprocessorOutputWriter {
	private rawOutput = emptyOutput();

	private readonly maxCharacterRunLength: number;
	private readonly maxCharacterRunLengthOverrides: Map<number, number>;

	private inWord = false;
	private lastWrittenCharacter = -1;
	private remainingCharacterWriteCounter = -1;

	public constructor({ maxCharacterRunLength, maxCharacterRunLengthOverrides }: PreprocessorOutputWriterOptions) {
		this.maxCharacterRunLength = maxCharacterRunLength;
		this.maxCharacterRunLengthOverrides = maxCharacterRunLengthOverrides;
	}

	public getOutput(): ReadonlyTextPreprocessorOutput {
		return this.rawOutput;
	}

	public reset() {
		this.rawOutput = emptyOutput();

		this.inWord = false;
		this.lastWrittenCharacter = -1;
		this.remainingCharacterWriteCounter = -1;
	}

	public writeAlphaCharacter(char: number, index: number) {
		const isDifferentCharacter = this.lastWrittenCharacter !== char;
		const shouldWrite =
			isDifferentCharacter || // Last character written is not the same as this one
			this.remainingCharacterWriteCounter > 0; // We have not reached the maximum character run length.

		if (!shouldWrite) return;

		this.rawOutput.characters.push(char);
		this.rawOutput.originalIndices.push(index);

		this.lastWrittenCharacter = char;
		this.inWord = true;

		// If the remaining character write counter was reset or if the
		// character being written is not the same as the last one...
		if (this.remainingCharacterWriteCounter === -1 || isDifferentCharacter) {
			const limit = this.maxCharacterRunLengthOverrides.get(char) ?? this.maxCharacterRunLength;
			// -1 because we just wrote one character.
			this.remainingCharacterWriteCounter = limit - 1;
		} else {
			--this.remainingCharacterWriteCounter;
		}
	}

	public writeSeparator() {
		if (this.inWord) {
			this.rawOutput.wordBoundaries.set(this.position - 1);
			this.inWord = false;
		}
	}

	private get position() {
		return this.rawOutput.characters.length - 1;
	}
}

export interface PreprocessorOutputWriterOptions {
	maxCharacterRunLength: number;
	maxCharacterRunLengthOverrides: Map<number, number>;
}
