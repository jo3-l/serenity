/**
 * Metadata for flags or options.
 */
export interface FlagMetadata {
	/**
	 * The ID of this flag.
	 */
	id: string;

	/**
	 * The prefixes of this flag. For example, if there were `['--help', -h']`
	 * then both `-h` and `--help` would be recognized as flags of this type.
	 */
	prefixes: string[];
}
