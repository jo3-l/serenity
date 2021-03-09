import { isClass, isNullish, isObject, isSubclassOf, isThenable } from '#utils/predicates';

describe('isObject', () => {
	it.each([
		['numbers', 42],
		['bigints', 42n],
		['booleans', true],
		['symbols', Symbol('MySymbol')],
		['arrow functions', () => 123],
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		['classes', class {}],
		['null', null],
		['undefined', undefined],
	])('should return false for %s', (_, value) => {
		expect(isObject(value)).toBeFalsy();
	});

	it.each([
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		['class instances', new (class {})()],
		['plain objects', { hello: 'world' }],
	])('should return true for %s', (_, value) => {
		expect(isObject(value)).toBeTruthy();
	});
});

describe('isNullish', () => {
	it.each([
		['numbers', 42],
		['bigints', 42n],
		['booleans', true],
		['symbols', Symbol('MySymbol')],
		['arrow functions', () => 123],
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		['functions', function fn() {}],
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		['classes', class {}],
		['arrays', [123]],
		['objects', { hello: 'world' }],
	])('should return false for %s', (_, value) => {
		expect(isNullish(value)).toBeFalsy();
	});

	it('should return true for null', () => {
		expect(isNullish(null)).toBeTruthy();
	});

	it('should return true for undefined', () => {
		expect(isNullish(undefined)).toBeTruthy();
	});
});

describe('isClass', () => {
	it.each([
		['numbers', 42],
		['bigints', 42n],
		['booleans', true],
		['symbols', Symbol('MySymbol')],
		['arrow functions', () => 123],
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		['class instances', new (class {})()],
		['arrays', [123]],
		['objects', { hello: 'world' }],
		['null', null],
		['undefined', undefined],
	])('should return false for %s', (_, value) => {
		expect(isClass(value)).toBeFalsy();
	});

	it('should return true for classes', () => {
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		expect(isClass(class {})).toBeTruthy();
	});

	it('should return true for functions', () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		expect(isClass(function fn() {})).toBeTruthy();
	});
});

describe('isSubclassOf', () => {
	class Parent {
		protected foo = 'bar';
	}

	it('should return true if the class is a subclass of the superclass', () => {
		class Child extends Parent {
			protected baz = 'buz';
		}

		expect(isSubclassOf(Child, Parent)).toBeTruthy();
	});

	it('should return false if the class is not a subclass of the superclass', () => {
		class Unrelated {
			protected baz = 'buz';
		}

		expect(isSubclassOf(Unrelated, Parent)).toBeFalsy();
	});
});

describe('isThenable', () => {
	it.each([
		['numbers', 42],
		['bigints', 42n],
		['booleans', true],
		['symbols', Symbol('MySymbol')],
		['arrow functions', () => 123],
		['arrays', []],
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		['classes', class {}],
		// eslint-disable-next-line @typescript-eslint/no-extraneous-class
		['class instances', new (class {})()],
		['null', null],
		['undefined', undefined],
		['objects without then method or catch method', {}],
		['objects with then method but no catch method', { then: () => 1 }],
		['objects with catch method but no then method', { catch: () => 1 }],
		['null', null],
		['undefined', undefined],
	])('should return false for %s', (_, value) => {
		expect(isThenable(value)).toBeFalsy();
	});

	it('should return true if and only if the value has both a catch and then method', () => {
		expect(isThenable({ catch: () => 1, then: () => 1 })).toBeTruthy();
	});
});
