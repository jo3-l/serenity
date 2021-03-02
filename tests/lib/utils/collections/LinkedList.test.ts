import { LinkedList, Node } from '#utils/collections/LinkedList';

describe('Node', () => {
	describe('Node#value', () => {
		it('should take the value given in the constructor', () => {
			const node = new Node(1);
			expect(node.value).toBe(1);
		});
	});

	describe('Node#next', () => {
		it('should be undefined by default', () => {
			const node = new Node(1);
			expect(node.next).toBeUndefined();
		});
	});
});

describe('LinkedList', () => {
	describe('LinkedList#head', () => {
		it('should be undefined if the linked list is empty', () => {
			const list = new LinkedList<number>();
			expect(list.head).toBeUndefined();
		});
	});

	describe('LinkedList#unshift()', () => {
		it('should add a value to the front of the list', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			expect(list.head?.value).toBe(1);
		});
	});

	describe('LinkedList#shift()', () => {
		it('should throw if the list is empty', () => {
			const list = new LinkedList<number>();
			expect(() => list.shift()).toThrow();
		});

		it('should remove and return the last node added', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			expect(list.shift().value).toBe(1);
			expect(list.shift().value).toBe(2);
		});
	});

	describe('LinkedList#clear()', () => {
		it('should clear the list', () => {
			const list = new LinkedList<number>();
			list.unshift(1);
			list.clear();

			expect(list.head).toBeUndefined();
		});
	});

	describe('LinkedList#isEmpty', () => {
		it('should return true by default', () => {
			const list = new LinkedList<number>();
			expect(list.isEmpty).toBeTruthy();
		});

		it('should return false when the list is not empty', () => {
			const list = new LinkedList<number>();
			list.unshift(2);

			expect(list.isEmpty).toBeFalsy();
		});
	});

	describe('LinkedList#array()', () => {
		it('should return an empty array by default', () => {
			const list = new LinkedList<number>();
			expect(list.array()).toStrictEqual([]);
		});

		it('should return the elements of the list in order as an array', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			expect(list.array()).toStrictEqual([1, 2]);
		});
	});

	it('should be iterable', () => {
		const list = new LinkedList<number>();
		list.unshift(2);
		list.unshift(1);
		const iterator = list[Symbol.iterator]();

		/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
		expect((iterator.next().value as Node<number>).value).toBe(1);
		expect((iterator.next().value as Node<number>).value).toBe(2);
		/* eslint-enable @typescript-eslint/no-unnecessary-type-assertion */

		expect(iterator.next().done).toBeTruthy();
	});
});

describe('LinkedListIterator', () => {
	describe('LinkedListIterator#done', () => {
		it('should be true for empty lists', () => {
			const list = new LinkedList<number>();

			const iterator = list.listIterator();

			expect(iterator.done).toBeTruthy();
		});

		it('should be false if there are more elements', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();

			expect(iterator.done).toBeFalsy();
		});
	});

	describe('LinkedListIterator#next()', () => {
		it('should iterate through the list in order', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();

			expect(iterator.next().value).toBe(1);
			expect(iterator.next().value).toBe(2);
		});

		it('should return done: true for empty lists', () => {
			const list = new LinkedList<number>();
			const iterator = list.listIterator();

			expect(iterator.next().done).toBeTruthy();
		});

		it('should return done: true if there are no more elements', () => {
			const list = new LinkedList<number>();
			list.unshift(1);

			const iterator = list.listIterator();
			iterator.next();

			expect(iterator.next().done).toBeTruthy();
		});
	});

	describe('LinkedListIterator#skip()', () => {
		it('should throw if the end of iteration was reached before `n` elements were skipped', () => {
			const list = new LinkedList<number>();
			list.unshift(2);

			const iterator = list.listIterator();

			expect(() => iterator.skip(2)).toThrow();
		});

		it('should skip the number of elements given', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();
			iterator.skip(1);

			expect(iterator.next().value).toBe(2);
		});
	});

	describe('LinkedListIterator#remove()', () => {
		it('should throw if there is no current element to operate on', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();

			expect(() => iterator.remove()).toThrow();
		});

		it('should call shift() on the linked list if there are no previous elements', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();
			iterator.next();
			iterator.remove();

			expect(list.array()).toStrictEqual([2]);
		});

		it('should unlink the node from the previous element if there is one', () => {
			const list = new LinkedList<number>();
			list.unshift(3);
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();
			iterator.next();
			iterator.next();
			iterator.remove();

			expect(list.array()).toStrictEqual([1, 3]);
		});
	});

	describe('LinkedListIterator#replace()', () => {
		it('should throw if there is no current element to operate on', () => {
			const list = new LinkedList<number>();
			list.unshift(2);
			list.unshift(1);

			const iterator = list.listIterator();

			expect(() => iterator.replace(2)).toThrow();
		});

		it('should set the value of the current element', () => {
			const list = new LinkedList<number>();
			list.unshift(4);
			list.unshift(1);

			const iterator = list.listIterator();
			iterator.next();
			iterator.replace(2);

			expect(list.array()).toStrictEqual([2, 4]);
		});
	});

	describe('LinkedListIterator#insert()', () => {
		it('should call unshift() on the linked list if it is empty', () => {
			const list = new LinkedList<number>();

			const iterator = list.listIterator();
			iterator.insert(1);

			expect(list.array()).toStrictEqual([1]);
		});

		it('should add a new element', () => {
			const list = new LinkedList<number>();
			list.unshift(4);
			list.unshift(1);

			const iterator = list.listIterator();
			iterator.next();
			iterator.insert(2);

			expect(list.array()).toStrictEqual([1, 2, 4]);
		});

		it('should set the current element', () => {
			const list = new LinkedList<number>();

			const iterator = list.listIterator();
			iterator.insert(1);
			iterator.insert(2);

			expect(list.array()).toStrictEqual([1, 2]);
		});
	});

	it('should be iterable', () => {
		const list = new LinkedList<number>();
		list.unshift(4);
		list.unshift(1);

		const iterator = list.listIterator()[Symbol.iterator]();

		expect(iterator.next().value).toBe(1);
		expect(iterator.next().value).toBe(4);
		expect(iterator.next().done).toBeTruthy();
	});
});
