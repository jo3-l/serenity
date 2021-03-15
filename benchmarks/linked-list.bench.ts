import { LinkedList } from '#utils/collections/LinkedList';

import { benchmarks } from './wrapper';

benchmarks((suite) => {
	suite('add to list', (add) => {
		add('LinkedList#unshift() 1000x', () => {
			const linkedList = new LinkedList<number>();
			for (let i = 0; i < 1000; i++) linkedList.unshift(i);
		});

		add('Array#push() 1000x', () => {
			const array: number[] = [];
			for (let i = 0; i < 1000; i++) array.push(i);
		});
	});

	suite('remove element at middle', (add) => {
		const linkedList = new LinkedList<number>();
		for (let i = 999; i >= 0; i--) linkedList.unshift(i);

		const array = [...new Array(1000).keys()];

		add('LinkedListIterator#remove() at index 499/999', () => {
			const iter = linkedList.iter();
			for (const element of iter) {
				if (element === 499) {
					iter.remove();
					break;
				}
			}
		});

		add('Array#splice() at index 499/999', () => {
			for (const element of array) {
				if (element === 499) {
					array.splice(499, 1);
					break;
				}
			}
		});
	});

	suite('add element at middle', (add) => {
		const linkedList = new LinkedList<number>();
		for (let i = 999; i >= 0; i--) linkedList.unshift(i);

		const array = [...new Array(1000).keys()];

		add('LinkedListIterator#insert() at index 499/999', () => {
			const iter = linkedList.iter();
			for (const element of iter) {
				if (element === 499) {
					iter.insert(123);
					break;
				}
			}
		});

		add('Array#splice() at index 499/999', () => {
			for (let i = 0; i < array.length; i++) {
				if (array[i] === 499) {
					array.splice(i, 0, 123);
					break;
				}
			}
		});
	});
});
