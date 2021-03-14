/**
 * This is inspired by the benchmarking utility found in the
 * [Lexure](https://github.com/1Computer1/lexure) project.
 *
 * Copyright (c) 2020 1Computer1, MIT License.
 */
import type { MaybePromise } from '#lib/types/shared';

import type { Event } from 'benchmark';
import { Suite } from 'benchmark';
import { bold, green, yellow } from 'colorette';

const hzFormatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 2,
	minimumFractionDigits: 2,
});

const arithmeticMeanFormatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 16,
	minimumFractionDigits: 16,
});

/**
 * A utility for creating and running benchmark suites.
 *
 * @example
 * ```typescript
 * benchmarks((suite) => {
 *  suite('copy array', (add) => {
 *      const array = [...new Array(1000).keys()].sort(Math.random);
 *
 *      add('Array#slice', () => {
 *          const copy = array.slice();
 *      });
 *
 *      add('spread operator', () => {
 *          const copy = [...array];
 *      });
 *  });
 * });
 * ```
 *
 * @param fn - A function that takes one argument, the benchmark suite adder.
 */
export function benchmarks(fn: Consumer<BenchmarkSuiteAdder>) {
	const suites: [name: string, suite: Suite][] = [];
	fn((name, fn) => {
		suites.push([name, makeSuite(fn)]);
	});

	for (const [name, suite] of suites) {
		console.log(`${bold('>>>')} ${name}`);
		suite.run();
		console.log('');
	}

	console.log('Benchmarks completed.');
}

function makeSuite(fn: Consumer<TestCaseAdder>) {
	let testCaseCount = 0;
	const suite = new Suite()
		.on('cycle', ({ target }: Event) => {
			const stats = target.stats!;

			const hz = green(hzFormatter.format(target.hz!));
			const rme = stats.rme.toFixed(2);
			const arithmeticMean = yellow(arithmeticMeanFormatter.format(stats.mean));

			console.log(`  -> x${hz} ops/sec ±${rme}% ${arithmeticMean} secs/op    ${green(target.name!)}`);
		})
		.on('complete', function complete(this: Suite) {
			if (testCaseCount <= 1) return;
			const [name] = this.filter('fastest').map('name');
			console.log(`  -> Fastest is ${bold(name)}`);
		});

	fn((name, fn) => {
		++testCaseCount;
		suite.add(name, fn);
	});

	return suite;
}

type BenchmarkSuiteAdder = (name: string, callback: Consumer<TestCaseAdder>) => void;
type TestCaseAdder = (name: string, fn: () => MaybePromise<void>) => void;
type Consumer<T> = (value: T) => void;
