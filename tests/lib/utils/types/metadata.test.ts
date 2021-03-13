import type { MapLikeValueMetadata } from '#utils/type/metadata';
import { getMetadata, unknownValueSymbol, ValueKind } from '#utils/type/metadata';

describe('unknownValueSymbol', () => {
	it('should be a symbol', () => {
		expect(typeof unknownValueSymbol).toBe('symbol');
	});
});

describe('getValueMetadata()', () => {
	describe('primitives', () => {
		describe('functions', () => {
			test('normal functions', () => {
				expect(
					getMetadata(function fn() {
						return 'hello world';
					}),
				).toStrictEqual({ kind: ValueKind.Simple, typeName: 'Function' });
			});

			test('arrow functions', () => {
				expect(getMetadata(() => 123)).toStrictEqual({ kind: ValueKind.Simple, typeName: 'Function' });
			});
		});

		test('null', () => {
			expect(getMetadata(null)).toStrictEqual({
				kind: ValueKind.Simple,
				typeName: 'null',
			});
		});

		test.each([
			['undefined', undefined],
			// eslint-disable-next-line symbol-description
			['symbols without description', Symbol()],
			['symbols with a description', Symbol('hello world')],
			['numbers', 1],
			['strings', 'hello world'],
			['bigints', 1n],
		])('%s', (_, value) => {
			expect(getMetadata(value)).toStrictEqual({
				kind: ValueKind.Simple,
				typeName: typeof value,
			});
		});

		test('plain objects', () => {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			const metadata = getMetadata({ hello: 'world' }) as MapLikeValueMetadata;
			expect(metadata).toMatchObject({ kind: ValueKind.MapLike, size: 1, typeName: 'Record', defaultType: 'object' });

			const iter = metadata.entryIterator;
			expect([...iter]).toStrictEqual([['hello', 'world']]);
		});

		test('maps', () => {
			const map = new Map([
				['hello', 'world'],
				['foo', 'bar'],
			]);
			expect(getMetadata(map)).toStrictEqual({
				kind: ValueKind.MapLike,
				size: 2,
				typeName: 'Map',
				entryIterator: map.entries(),
			});
		});

		test('extended map', () => {
			class MyMap<K, V> extends Map<K, V> {}
			const myMap = new MyMap([
				['hello', 'world'],
				['foo', 'bar'],
			]);

			expect(getMetadata(myMap)).toStrictEqual({
				kind: ValueKind.MapLike,
				size: 2,
				typeName: 'MyMap',
				entryIterator: myMap.entries(),
			});
		});

		test('unnamed extended map', () => {
			class MyMap<K, V> extends Map<K, V> {}
			Reflect.defineProperty(MyMap, 'name', { value: undefined });

			const myMap = new MyMap([
				['hello', 'world'],
				['foo', 'bar'],
			]);

			expect(getMetadata(myMap)).toStrictEqual({
				kind: ValueKind.MapLike,
				size: 2,
				typeName: 'Map',
				entryIterator: myMap.entries(),
			});
		});

		test('set', () => {
			const set = new Set(['hello', 'world']);
			expect(getMetadata(set)).toStrictEqual({
				kind: ValueKind.SequenceLike,
				size: 2,
				typeName: 'Set',
				valueIterator: set.values(),
			});
		});

		test('extended set', () => {
			class MySet<T> extends Set<T> {}
			const mySet = new MySet(['hello', 'world']);

			expect(getMetadata(mySet)).toStrictEqual({
				kind: ValueKind.SequenceLike,
				size: 2,
				typeName: 'MySet',
				valueIterator: mySet.values(),
			});
		});

		test('unnamed extended set', () => {
			class MySet<T> extends Set<T> {}
			Reflect.defineProperty(MySet, 'name', { value: undefined });

			const mySet = new MySet(['hello', 'world']);

			expect(getMetadata(mySet)).toStrictEqual({
				kind: ValueKind.SequenceLike,
				size: 2,
				typeName: 'Set',
				valueIterator: mySet.values(),
			});
		});

		test('array', () => {
			const array = ['hello', 'world'];
			expect(getMetadata(array)).toStrictEqual({
				kind: ValueKind.SequenceLike,
				size: 2,
				typeName: 'Array',
				valueIterator: array.values(),
			});
		});

		test('extended array', () => {
			class MyArray<T> extends Array<T> {}
			const myArray = new MyArray();
			myArray.push('hello', 'world');

			expect(getMetadata(myArray)).toStrictEqual({
				kind: ValueKind.SequenceLike,
				size: 2,
				typeName: 'MyArray',
				valueIterator: myArray.values(),
			});
		});

		test('unnamed extended array', () => {
			class MyArray<T> extends Array<T> {}
			Reflect.defineProperty(MyArray, 'name', { value: undefined });

			const myArray = new MyArray();
			myArray.push('hello', 'world');

			expect(getMetadata(myArray)).toStrictEqual({
				kind: ValueKind.SequenceLike,
				size: 2,
				typeName: 'Array',
				valueIterator: myArray.values(),
			});
		});

		test('proxy', () => {
			const target = { hello: 'world' };
			const proxy = new Proxy(target, {});
			expect(getMetadata(proxy)).toStrictEqual({
				kind: ValueKind.ContainerLike,
				value: target,
				typeName: 'Proxy',
			});
		});

		test('promise', async () => {
			expect(getMetadata(Promise.resolve(42))).toStrictEqual({
				kind: ValueKind.ContainerLike,
				value: 42,
				typeName: 'Promise',
			});

			const promise = new Promise((r) => setTimeout(r, 100));
			expect(getMetadata(promise)).toStrictEqual({
				kind: ValueKind.ContainerLike,
				value: unknownValueSymbol,
				typeName: 'Promise',
			});

			// Wait for the promise to resolve, so the worker exits gracefully.
			await promise;
		});

		test('class instance', () => {
			class Person {
				public name!: string;
				public age!: number;
			}

			expect(getMetadata(new Person())).toStrictEqual({
				kind: ValueKind.Simple,
				typeName: 'Person',
			});
		});

		test('unnamed class instance', () => {
			class Person {
				public name!: string;
				public age!: number;
			}
			Reflect.defineProperty(Person, 'name', { value: undefined });

			expect(getMetadata(new Person())).toStrictEqual({
				kind: ValueKind.Simple,
				typeName: 'object',
			});
		});
	});
});
