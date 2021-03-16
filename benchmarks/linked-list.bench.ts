import { LinkedList } from '#utils/collections/LinkedList';

import { benchmarks } from './wrapper';

benchmarks((suite) => {
	suite('add to list', (add) => {
		add.each([[5], [10], [20], [50], [100], [250], [500], [1000]])(
			(times) => `unshift linked list ${times}x`,
			(times) => {
				const linkedList = new LinkedList<number>();
				for (let i = 0; i < times; i++) linkedList.unshift(i);
			},
		);

		add.each([[5], [10], [20], [50], [100], [250], [500], [1000]])(
			(times) => `array push ${times}x`,
			(times) => {
				const array: number[] = [];
				for (let i = 0; i < times; i++) array.push(i);
			},
		);
	});

	suite('remove element at middle', (add) => {
		add.each([[5], [10], [20], [50], [100], [250], [500], [1000]])(
			(length) => `find & remove element in linked list w/ ${length} length`,
			(length) => {
				const needle = Math.floor(length / 2);

				const linkedList = new LinkedList<number>();
				for (let i = length - 1; i >= 0; i--) linkedList.unshift(i);
				const iter = linkedList.iter();

				return () => {
					for (const element of iter) {
						if (element === needle) {
							iter.remove();
							iter.insert(needle);
							break;
						}
					}
				};
			},
		);

		add.each([[5], [10], [20], [50], [100], [250], [500], [1000]])(
			(length) => `find & splice in array w/ ${length} length`,
			(length) => {
				const needle = Math.floor(length / 2);
				const array = [...new Array(length).keys()];

				return () => {
					// Yes, this can be done directly (without the loop) but we're
					// intentionally measuring it with the loop taken into account
					// because that's how we're going to be using this in the app.
					for (const element of array) {
						if (element === needle) {
							array.splice(needle, 1);
							array.push(needle);
							break;
						}
					}
				};
			},
		);
	});

	suite('add element at middle', (add) => {
		add.each([[5], [10], [20], [50], [100], [250], [500], [1000]])(
			(length) => `find & insert element in linked list w/ ${length} length`,
			(length) => {
				const needle = Math.floor(length / 2);

				const linkedList = new LinkedList<number>();
				for (let i = length - 1; i >= 0; i--) linkedList.unshift(i);
				const iter = linkedList.iter();

				return () => {
					for (const element of iter) {
						if (element === needle) {
							iter.insert(123);
							iter.remove();
							break;
						}
					}
				};
			},
		);

		add.each([[5], [10], [20], [50], [100], [250], [500], [1000]])(
			(length) => `find & insert element in array w/ ${length} length`,
			(length) => {
				const needle = Math.floor(length / 2);
				const array = [...new Array(length).keys()];

				// See comment above: we intentionally take the loop into account
				// even though it is unnecessary in this specific case.
				return () => {
					for (const element of array) {
						if (element === needle) {
							array.splice(needle, 0, 123);
							array.pop();
							break;
						}
					}
				};
			},
		);
	});
});
