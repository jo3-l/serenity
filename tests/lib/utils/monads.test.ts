import { err, ok, some } from '#utils/monads';

describe('maybe monad', () => {
	describe('some()', () => {
		it('should create a Some from the given value', () => {
			expect(some(1)).toStrictEqual({
				exists: true,
				value: 1,
			});
		});
	});
});

describe('result monad', () => {
	describe('ok()', () => {
		it('should create an Ok from the given value', () => {
			expect(ok(1)).toStrictEqual({
				ok: true,
				value: 1,
			});
		});
	});

	describe('err()', () => {
		it('should create an Err from the given error value', () => {
			expect(err(1)).toStrictEqual({
				ok: false,
				error: 1,
			});
		});
	});
});
