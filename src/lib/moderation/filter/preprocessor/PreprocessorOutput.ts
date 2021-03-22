import type { DeepReadonly } from '#lib/types/shared';
import { BitSet } from '#utils/collections/BitSet';

/**
 * The text preprocessor output.
 */
export interface TextPreprocessorOutput {
	/**
	 * A list comprised of lowercase alphabetical characters based off the
	 * characters in the original text. Character runs may also be collapsed
	 * according to the options set in the `TextPreprocessor`.
	 *
	 * For example, given the input `Hello World`, the contents of this list
	 * would be `['h', 'e', 'l', 'l', 'o', 'w', 'o', 'r', 'l', 'd']`. Note that
	 * `'h'` does not represent the string `'c'`: we use `'c'` to denote the
	 * character code for `'c` here.
	 */
	characters: number[];

	/**
	 * A bitset of indices which are word boundaries. A word boundary is a
	 * position at which a 'word' (a phrase solely comprised of alphabetical
	 * characters) ends.
	 */
	wordBoundaries: BitSet;

	/**
	 * A mapping of character index in the `characters` array to its original
	 * index in the text.
	 */
	originalIndices: number[];
}

/**
 * A deeply readonly variant of the `TextPreprocessorOutput`.
 */
export type ReadonlyTextPreprocessorOutput = DeepReadonly<TextPreprocessorOutput>;

/**
 * Creates a new empty preprocessor output.
 *
 * @returns - The output.
 */
export function emptyOutput(): TextPreprocessorOutput {
	return { characters: [], wordBoundaries: new BitSet(), originalIndices: [] };
}
