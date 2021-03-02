import { BasicRateLimiter } from '#utils/ratelimits/BasicRateLimiter';

function runWithTime<T>(timestamp: number, fn: () => T) {
	jest.spyOn(global.Date, 'now').mockImplementation(() => timestamp);
	return fn();
}

describe('BasicRateLimiter#setCooldown()', () => {
	it('should set the cooldown', () => {
		const ratelimiter = new BasicRateLimiter();
		ratelimiter.setCooldown(5000);
		expect(ratelimiter.cooldown).toBe(5000);
	});
});

describe('BasicRateLimiter#request()', () => {
	it('should return the time until the bucket is unlocked', () => {
		const ratelimiter = new BasicRateLimiter().setCooldown(5000);

		expect(runWithTime(0, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(5, () => ratelimiter.request('key'))).toBe(4995);
	});

	it('entries should expire over time', () => {
		const ratelimiter = new BasicRateLimiter().setCooldown(5000);
		runWithTime(0, () => ratelimiter.request('key'));

		expect(runWithTime(5000, () => ratelimiter.request('key'))).toBe(0);
	});

	it('requests with different keys should be independent', () => {
		const ratelimiter = new BasicRateLimiter().setCooldown(5000);
		runWithTime(0, () => ratelimiter.request('keyFoo'));

		expect(runWithTime(0, () => ratelimiter.request('keyBar'))).toBe(0);
	});
});

describe('BasicRateLimiter#prune()', () => {
	it('should not prune entries that have not expired', () => {
		const ratelimiter = new BasicRateLimiter().setCooldown(5000);
		runWithTime(0, () => ratelimiter.request('key'));
		runWithTime(5, () => ratelimiter.prune());

		expect(runWithTime(5, () => ratelimiter.request('key'))).toBe(4995);
	});
});
