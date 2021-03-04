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
