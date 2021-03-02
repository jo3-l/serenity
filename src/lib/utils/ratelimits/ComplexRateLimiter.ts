import type { RateLimiter } from './RateLimiter';

/**
 * An entry in the bucket.
 */
export interface BucketEntry {
	tokens: number;
	createdAt: number;
	lastSetAt: number;
}

/**
 * Options for bucket entries.
 */
export interface EntryOptions {
	/**
	 * The time a single bucket entry lasts, in milliseconds. It is expected
	 * that this is greater than 0.
	 *
	 * For example, if `entryLifetime` was `5000` and `capacity` was `5`, then a
	 * maximum of 5 requests can be made in 5 seconds.
	 */
	lifetime: number;

	/**
	 * The maximum number of tickets. It is expected that this is greater than
	 * 0.
	 *
	 * This limits the number of requests that can be made within `lifetime`
	 * milliseconds.
	 */
	capacity: number;
}

/**
 * A ratelimiter implementation that can be used as both a token bucket and a
 * leaky bucket.
 *
 * @remarks
 * This is intended to be used for non-trivial cases where one wants to allow
 * multiple requests within a certain timespan (i.e. 5 requests in 5 seconds).
 *
 * For simpler cases where one only needs to allow one request in a certain
 * timespan (i.e. 1 request in 5 seconds), see the `BasicRateLimiter` class,
 * built to handle that specific case. It uses less memory and is more
 * performant than this implementation, at the cost of generality.
 */
export class ComplexRateLimiter<T> implements RateLimiter<T> {
	/**
	 * The minimum time in milliseconds that must pass between requests. If this
	 * is set to 0, there is no limit.
	 *
	 * For example, if this is set to `5000`, then a request can only be made
	 * every 5 seconds.
	 */
	public cooldown = 0;

	/**
	 * Options for bucket entries.
	 */
	public entryOptions: EntryOptions = { lifetime: 0, capacity: 1 };

	private readonly entries = new Map<T, BucketEntry>();

	/**
	 * Sets the cooldown of the ratelimiter.
	 *
	 * @param cooldown - The cooldown to use, in milliseconds.
	 * @returns The ratelimiter.
	 */
	public setCooldown(cooldown: number) {
		this.cooldown = cooldown;
		return this;
	}

	/**
	 * Sets the entry options for the ratelimiter.
	 *
	 * @param entryOptions - Options to use.
	 * @returns The ratelimiter.
	 */
	public setEntryOptions(entryOptions: EntryOptions) {
		this.entryOptions = entryOptions;
		return this;
	}

	public request(key: T) {
		const entry = this.entries.get(key);
		const now = Date.now();

		if (!entry) {
			this.entries.set(key, {
				tokens: 1,
				createdAt: now,
				lastSetAt: now,
			});
			return 0;
		}

		const timeUntilUnlock = this.computeWaitTime(now, entry);
		if (timeUntilUnlock > 0) return timeUntilUnlock;

		if (this.shouldResetEntry(now, entry)) {
			entry.tokens = 1;
			entry.createdAt = now;
			entry.lastSetAt = now;
		} else {
			++entry.tokens;
			entry.lastSetAt = now;
		}

		return 0;
	}

	public prune() {
		const now = Date.now();
		for (const [key, entry] of this.entries) {
			const timeUntilUnlock = this.computeWaitTime(now, entry);
			/* istanbul ignore next - Hard to test, as `entries` is a private field */
			if (timeUntilUnlock === 0 && this.shouldResetEntry(now, entry)) this.entries.delete(key);
		}
	}

	private computeWaitTime(now: number, entry: BucketEntry) {
		return Math.max(this.checkRequestDelay(now, entry), this.checkEntry(now, entry));
	}

	private checkRequestDelay(now: number, entry: BucketEntry) {
		// If there is no delay set, return 0.
		if (this.cooldown === 0) return 0;

		// Compute the time passed since the last request was made to this bucket.
		const timePassed = now - entry.lastSetAt;

		// If the time passed was less than the minimum delay between requests,
		// then we should wait until the minimum delay has passed before more
		// requests can be made.
		if (timePassed < this.cooldown) return this.cooldown - timePassed;

		// Otherwise, more requests can be made immediately.
		return 0;
	}

	private checkEntry(now: number, entry: BucketEntry) {
		const shouldExpireAt = entry.createdAt + this.entryOptions.lifetime;

		// If the entry should have expired, then new requests can be made
		// immediately.
		if (shouldExpireAt <= now) return 0;

		// If the number of tokens in the bucket is less than the maximum
		// capacity, then new requests can be made immediately.
		if (entry.tokens < this.entryOptions.capacity) return 0;

		// Otherwise, more requests can be made after the entry expires.
		return shouldExpireAt - now;
	}

	private shouldResetEntry(now: number, entry: BucketEntry) {
		return entry.tokens === this.entryOptions.capacity || entry.createdAt + this.entryOptions.lifetime <= now;
	}
}
