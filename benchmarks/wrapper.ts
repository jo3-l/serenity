/**
 * This is inspired by the benchmarking utility found in the
 * [Lexure](https://github.com/1Computer1/lexure) project.
 *
 * Copyright (c) 2020 1Computer1, MIT License.
 */
import type { Event } from 'benchmark';
import { Suite } from 'benchmark';
import { bold, green, yellow } from 'colorette';

/**
 * A utility for creating and running benchmark suites.
 *
 * @example
 * ```typescript
 * benchmarks((suite) => {
 * 	suite('copy array', (add) => {
 * 		add('Array#slice()', () => {
 * 			const array = [...new Array(1000).keys()];
 * 			return () => array.slice();
 * 		});
 *
 * 		add('spread operator', () => {
 * 			const array = [...new Array(1000).keys()];
 * 			return () => [...array];
 * 		})
 * 	})
 * });
 * ```
 *
 * @param fn - A function that takes one argument, the benchmark suite adder.
 */
export function benchmarks(callback: (suite: SuiteAddFunction) => void) {
	const suites: [name: string, suite: Suite][] = [];
	callback((name, fn) => {
		suites.push([name, makeSuite(fn)]);
	});

	for (const [name, suite] of suites) {
		console.log(`${bold('>>>')} ${name}`);
		suite.run();
		console.log('');
	}

	console.log('Benchmarks completed.');
}

function makeSuite(fn: (add: TestCaseAddFunction) => void) {
	let n = 0;
	const suite = new Suite()
		.on('cycle', ({ target }: Event) => {
			const stats = target.stats!;

			const hz = green(target.hz!.toLocaleString(undefined, { maximumFractionDigits: 2 }));
			const rme = stats.rme.toFixed(2);
			const mean = yellow(stats.mean.toLocaleString(undefined, { maximumFractionDigits: 16 }));

			console.log(`  -> x${hz} ops/sec ±${rme}% ${mean} secs/op    ${green(target.name!)}`);
		})
		.on('complete', function complete(this: Suite) {
			if (n <= 1) return;
			const [name] = this.filter('fastest').map('name');
			console.log(`  -> Fastest is ${bold(name)}`);
		});

	const addFunction: TestCaseAddFunction = (name, fn) => {
		const result = fn();
		const resolvedFn = typeof result === 'function' ? result : fn;

		suite.add(name, resolvedFn);
		++n;
	};

	addFunction.each = <T extends readonly [] | readonly V[], V extends readonly [] | readonly unknown[]>(data: T) => {
		return (nameGenerator, fn) => {
			for (const values of data) {
				const name = nameGenerator(...(values as any));
				addFunction(name, () => fn(...(values as any)));
			}
		};
	};

	fn(addFunction);

	return suite;
}

/**
 * Registers a benchmark suite.
 */
export type SuiteAddFunction = (name: string, callback: (add: TestCaseAddFunction) => void) => void;

/**
 * Represents a test case to benchmark.
 */
export type TestCase = () => void | (() => void);

/**
 * Registers a test case to benchmark.
 */
export interface TestCaseAddFunction {
	/**
	 * Adds a test case to benchmark.
	 *
	 * @example
	 * ```typescript
	 * add('array pop', () => {
	 * 	// Generate the input in the callback...
	 * 	const array = [...new Array(1000).keys()];
	 *
	 * 	// And return another function that runs the code to be benchmarked.
	 * 	return () => array.pop();
	 * });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * add('add numbers', () => {
	 * 	// If there is no setup needed, run the code to be benchmarked directly in the function.
	 * 	const result = 1 + 1;
	 * })
	 * ```
	 *
	 * @param name - Name of the test case.
	 * @param fn - Test case itself. If additional setup is needed, run the
	 * setup in the function and then return another function that runs the code
	 * to be benchmarked.
	 */
	(name: string, fn: TestCase): void;

	/**
	 * Generates and adds test cases.
	 *
	 * @example
	 * ```typescript
	 * add.each([
	 * 	[20],
	 * 	[50],
	 * 	[100],
	 * ])((size) => `new Array(${size})`, (size) => {
	 * 	const generated = new Array(size);
	 * });
	 *
	 * // Same as:
	 * add('new Array(20)', () => {
	 * 	const generated = new Array(20);
	 * });
	 *
	 * add('new Array(50)', () => {
	 * 	const generated = new Array(50);
	 * });
	 * // etc...
	 * ```
	 *
	 * @param data - A 2D array with the arguments that are passed into the test
	 * case `fn` for each row.
	 * @returns A function that has two parameters - 1) the name generator,
	 * which generates the name for the case based off the row of values, and 2)
	 * the test case function, which returns the code to be benchmarked based
	 * off the row of values.
	 */
	each<T extends readonly [] | readonly V[], V extends readonly [] | readonly unknown[]>(
		data: T,
	): (nameGenerator: (...args: T[number]) => string, fn: (...args: T[number]) => ReturnType<TestCase>) => void;
}
