import { ComplexRateLimiter } from '#utils/ratelimits/ComplexRateLimiter';

function runWithTime<T>(timestamp: number, fn: () => T) {
	jest.spyOn(global.Date, 'now').mockImplementation(() => timestamp);
	return fn();
}

describe('ComplexRateLimiter#setCooldown()', () => {
	it('should set the cooldown', () => {
		const ratelimiter = new ComplexRateLimiter().setCooldown(5000);
		expect(ratelimiter.cooldown).toBe(5000);
	});
});

describe('ComplexRateLimiter#setEntryOptions()', () => {
	it('should set the entry options', () => {
		const options = { lifetime: 5000, capacity: 5 };
		const ratelimiter = new ComplexRateLimiter().setEntryOptions(options);

		expect(ratelimiter.entryOptions).toStrictEqual(options);
	});
});

describe('ComplexRateLimiter#request()', () => {
	it('should work when used as a leaky bucket', () => {
		const ratelimiter = new ComplexRateLimiter().setEntryOptions({ lifetime: 5000, capacity: 2 });

		expect(runWithTime(0, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(10, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(15, () => ratelimiter.request('key'))).toBe(4985);
		expect(runWithTime(5000, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(5005, () => ratelimiter.request('key'))).toBe(0);
	});

	it('should work when used as a token bucket', () => {
		const ratelimiter = new ComplexRateLimiter().setCooldown(5000);

		expect(runWithTime(0, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(5, () => ratelimiter.request('key'))).toBe(4995);
		expect(runWithTime(5000, () => ratelimiter.request('key'))).toBe(0);
	});

	it('should work if used as a combination of token and leaky bucket', () => {
		const ratelimiter = new ComplexRateLimiter().setCooldown(2000).setEntryOptions({ lifetime: 10_000, capacity: 2 });

		expect(runWithTime(0, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(5, () => ratelimiter.request('key'))).toBe(1995);
		expect(runWithTime(2000, () => ratelimiter.request('key'))).toBe(0);
		expect(runWithTime(4000, () => ratelimiter.request('key'))).toBe(6000);
		expect(runWithTime(5000, () => ratelimiter.request('key'))).toBe(5000);
	});
});

describe('ComplexRateLimiter#prune()', () => {
	it('should not prune entries that have not expired', () => {
		const ratelimiter = new ComplexRateLimiter().setCooldown(5000);
		runWithTime(0, () => ratelimiter.request('key'));
		ratelimiter.prune();

		expect(runWithTime(5, () => ratelimiter.request('key'))).toBe(4995);
	});
});
