/**
 * Ratelimits requests.
 */
export interface RateLimiter<T> {
	/**
	 * Tries to queue a request, returning `0` if it succeeded. If the
	 * ratelimiter is locked at the moment, it returns the amount of time needed
	 * until another request can be successfully queued.
	 *
	 * @param key - Key of the entry to check.
	 * @returns The time until the bucket unlocks in milliseconds, or 0 if none.
	 */
	request(key: T): number;

	/**
	 * Cleans up unused data. For example, if a Map was used to store the bucket
	 * entries internally, this method might remove all entries that should have
	 * expired already.
	 */
	prune?(): void;
}
