import type { RateLimiter } from './RateLimiter';

/**
 * A basic ratelimiter implementation that handles the special case of allowing
 * 1 request in a given timespan. It is more performant and uses less memory
 * than the `ComplexRatelimiter`, but does so at the cost of generality.
 */
export class BasicRateLimiter<T> implements RateLimiter<T> {
	/**
	 * The minimum time in milliseconds that must pass between requests. It is
	 * expected that this is a positive number.
	 */
	public cooldown = 0;

	private readonly entries = new Map<T, number>();

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

	public request(key: T) {
		const now = Date.now();

		if (this.entries.has(key)) {
			const createdAt = this.entries.get(key)!;

			const remainingTime = createdAt + this.cooldown - now;
			if (remainingTime > 0) return remainingTime;

			this.entries.set(key, now);
			return 0;
		}

		this.entries.set(key, now);
		return 0;
	}

	public prune() {
		const now = Date.now();
		for (const [key, createdAt] of this.entries) {
			/* istanbul ignore next - Hard to test, as `entries` is a private field */
			if (createdAt + this.cooldown <= now) this.entries.delete(key);
		}
	}
}
