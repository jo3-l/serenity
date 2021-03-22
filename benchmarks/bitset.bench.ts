import { BitSet } from '../src/lib/utils/collections/BitSet';
import { benchmarks } from './wrapper';

benchmarks((suite) => {
	suite('add to set', (add) => {
		for (const count of [5, 10, 50, 250, 500, 1000, 2000]) {
			add(`add numbers in [0, ${count}) to a bitset`, () => {
				const bitset = new BitSet();
				for (let i = 0; i < count; i++) bitset.set(i);
			});

			add(`add numbers in [0, ${count}) to a bitset (preallocated)`, () => {
				const bitset = new BitSet(count);
				for (let i = 0; i < count; i++) bitset.set(i);
			});

			add(`add numbers in [0, ${count}) to a set`, () => {
				const set = new Set<number>();
				for (let i = 0; i < count; i++) set.add(i);
			});

			add(`add numbers in [0, ${count}) to an array`, () => {
				const array: number[] = [];
				for (let i = 0; i < count; i++) array.push(i);
			});
		}
	});

	suite('check if integer is in set', (add) => {
		for (const count of [5, 10, 50, 250, 500, 1000, 2000]) {
			const mid = count >> 1;

			add(`check whether integer is member of bitset w/ ${count} elements`, () => {
				const bitset = new BitSet(count);
				for (let i = 0; i < count; i++) bitset.set(i);

				return () => bitset.get(mid);
			});

			add(`check whether integer is member of set w/ ${count} elements`, () => {
				const set = new Set<number>();
				for (let i = 0; i < count; i++) set.add(i);

				return () => set.has(mid);
			});

			add(`check whether integer is member of array w/ ${count} elements`, () => {
				const array: number[] = [];
				for (let i = 0; i < count; i++) array.push(i);

				return () => array.includes(mid);
			});
		}
	});

	suite('toggle membership of element in set', (add) => {
		add('toggle membership of element in bitset w/ 2500 elements', () => {
			const bitset = new BitSet(5000);
			for (let i = 0; i < 5000; i++) bitset.set(i);

			return () => bitset.toggle(2500);
		});

		add('toggle membership of element in bitset w/ 2500 elements', () => {
			const set = new Set<number>();
			for (let i = 0; i < 5000; i++) set.add(i);

			return () => (set.has(2500) ? set.delete(2500) : set.add(2500));
		});
	});

	suite('delete element from set', (add) => {
		add('delete element from bitset w/ 2500 elements', () => {
			const bitset = new BitSet(5000);
			for (let i = 0; i < 5000; i++) bitset.set(i);

			return () => bitset.clear(2500);
		});

		add('delete element from set w/ 2500 elements', () => {
			const set = new Set<number>();
			for (let i = 0; i < 5000; i++) set.add(i);

			return () => set.delete(2500);
		});
	});
});
