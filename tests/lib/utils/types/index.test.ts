import { inspectTypeOf } from '#utils/type';
import { unknownValueSymbol } from '#utils/type/metadata';

describe('inspectTypeOf()', () => {
	it('should return unknown if given `unknownValueSymbol`', () => {
		expect(inspectTypeOf(unknownValueSymbol, { depth: 0 })).toBe('unknown');
	});

	it('should return the type name for simple values', () => {
		expect(inspectTypeOf(null, { depth: 1 })).toBe('null');
		expect(inspectTypeOf(Symbol('hello world'), { depth: 1 })).toBe('symbol');
	});

	describe('container-like types', () => {
		it('should use unknown as the internal type if the remaining depth is 0', () => {
			const proxy = new Proxy(() => 123, {});
			expect(inspectTypeOf(proxy, { depth: 0 })).toBe('Proxy<unknown>');
		});

		it('should inspect the internal type for container-like values', () => {
			const proxy = new Proxy(() => 123, {});
			expect(inspectTypeOf(proxy, { depth: 1 })).toBe('Proxy<Function>');
		});
	});

	describe('sequence-like types', () => {
		it('should use unknown as the value type if the sequence is empty', () => {
			const set = new Set();
			expect(inspectTypeOf(set, { depth: 1 })).toBe('Set<unknown>');
		});

		it('should use unknown as the value size if the remaining depth is 0', () => {
			const set = new Set([1, 2, 3]);
			expect(inspectTypeOf(set, { depth: 0 })).toBe('Set<unknown>');
		});

		it('should use unknown as the value type if the sequence size exceeds the maximum size', () => {
			const set = new Set();
			for (let i = 0; i < 201; i++) set.add(i);

			expect(inspectTypeOf(set, { depth: 1 })).toBe('Set<unknown>');
		});

		it('should iterate through the values of the sequence and create a union of types', () => {
			const set = new Set(['hello', 'world', 123]);
			expect(inspectTypeOf(set, { depth: 1 })).toBe('Set<number | string>');
		});

		it('should truncate the value type to `unknown` if the number of constituents of the union is greater than the maximum', () => {
			const set = new Set(['hello', 'world', 123, Symbol('hello world'), null]);
			expect(inspectTypeOf(set, { depth: 1 })).toBe('Set<unknown>');
		});
	});

	describe('map-like types', () => {
		it('should use unknown as the key & value type if the map is empty', () => {
			const map = new Map();
			expect(inspectTypeOf(map, { depth: 1 })).toBe('Map<unknown, unknown>');
		});

		it('should use unknown as the key & value type if the remaining depth is 0', () => {
			const map = new Map([['hello', 'world']]);
			expect(inspectTypeOf(map, { depth: 0 })).toBe('Map<unknown, unknown>');
		});

		it('should use unknown as the key & value type if the map size exceeds the maximum size', () => {
			const map = new Map();
			for (let i = 0; i < 201; i++) map.set(i, 'hello');

			expect(inspectTypeOf(map, { depth: 1 })).toBe('Map<unknown, unknown>');
		});

		it('should iterate through the entries of the map and create a union of types', () => {
			const map = new Map<string | null, number | symbol | string>([
				['hello', 123],
				['world', Symbol('hello world')],
				[null, '123'],
			]);
			expect(inspectTypeOf(map, { depth: 1 })).toBe('Map<null | string, number | string | symbol>');
		});

		it('should truncate the key type to `unknown` if the number of constituents of the union is greater than the maximum', () => {
			const map = new Map<number | symbol | string | null, string>([
				[123, 'foo'],
				[Symbol('hello'), 'world'],
				['foo', 'baz'],
				[null, 'null :('],
			]);
			expect(inspectTypeOf(map, { depth: 1 })).toBe('Map<unknown, string>');
		});

		it('should truncate the value type to `unknown` if the number of constituents of the union is greater than the maximum', () => {
			const map = new Map<string, number | symbol | string | null>([
				['hello', 123],
				['world', Symbol('hello')],
				['foo', 'bar'],
				['baz', null],
			]);
			expect(inspectTypeOf(map, { depth: 1 })).toBe('Map<string, unknown>');
		});

		it('should use unknown as both the key & value type if both are over the limit', () => {
			const map = new Map<string | symbol | null | number, string | symbol | null | number>([
				[123, 123],
				[Symbol('hello'), Symbol('hello')],
				['foo', 'foo'],
				[null, null],
			]);
			expect(inspectTypeOf(map, { depth: 1 })).toBe('Map<unknown, unknown>');
		});
	});
});
