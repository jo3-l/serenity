/**
 * An iterator for linked lists that allows modification during iteration.

 * This is inspired by Java 8's
 * [ListIterator](https://docs.oracle.com/javase/7/docs/api/java/util/ListIterator.html)
 * interface.
 */
export class LinkedListIterator<T> implements IterableIterator<T> {
	private canOperateOnCurrentElement = false;
	private previousNode?: Node<T>;
	private currentNode?: Node<T>;

	/**
	 * Create a new ListIterator over the given LinkedList.
	 *
	 * @param linkedList - The linked list to iterate over.
	 */
	public constructor(private readonly linkedList: LinkedList<T>) {
		this.currentNode = linkedList.head;
	}

	/**
	 * Advances the iterator position by `n`.
	 *
	 * @throws If the end of iteration was reached before `n` elements were
	 * skipped.
	 * @param n - Number of elements to skip.
	 */
	public skip(n: number) {
		for (let i = 0; i < n; i++) {
			if (this.done) {
				throw new Error('The iterator reached the end of iteration before `n` elements were skipped.');
			}
			this.next();
		}
	}

	/**
	 * Whether the iterator is done.
	 */
	public get done() {
		if (this.canOperateOnCurrentElement) return this.currentNode?.next === undefined;
		return this.currentNode === undefined;
	}

	public next(): IteratorResult<T, undefined> {
		// If the current node is invalid, then `currentNode` is actually the
		// next node.
		if (!this.canOperateOnCurrentElement) {
			// If the list was empty, throw an error.
			if (!this.currentNode) return { done: true, value: undefined };
			this.canOperateOnCurrentElement = true;
			return { done: false, value: this.currentNode.value };
		}

		const nextNode = this.currentNode?.next;
		if (!nextNode) return { done: true, value: undefined };

		this.previousNode = this.currentNode;
		this.currentNode = nextNode;
		this.canOperateOnCurrentElement = true;
		return { done: false, value: nextNode.value };
	}

	/**
	 * Removes the current element from the linked list.
	 *
	 * @throws If there is no current element to operate on (this occurs if
	 * `next` was never called before).
	 * @remarks
	 * This does not change the result of the next call to `next()`. However,
	 * the return value of `nextIndex()` will change.
	 */
	public remove() {
		if (!this.canOperateOnCurrentElement) {
			throw new Error('Tried to call remove() when there was no current element to operate on.');
		}

		// This assertion is safe as `currentNode` will always be defined if we
		// can operate on the current element.
		if (this.previousNode) this.previousNode.next = this.currentNode!.next;
		else this.linkedList.shift();
	}

	/**
	 * Replaces the value of the current element.
	 *
	 * @throws If there is no current element to operate on (this occurs if
	 * `next` was never called before).
	 * @param value - Value to replace with.
	 */
	public replace(value: T) {
		if (!this.canOperateOnCurrentElement) {
			throw new Error('Tried to call replace() when there was no current element to operate on.');
		}

		// This assertion is safe because `currentNode` if we can operate on the
		// current element.
		this.currentNode!.value = value;
	}

	/**
	 * Inserts the specified element into the list immediately after the current
	 * element. Note that this will implicitly set the current node to the new
	 * node.
	 *
	 * @param value - Value to insert.
	 */
	public insert(value: T) {
		this.canOperateOnCurrentElement = true;

		if (!this.currentNode) {
			this.linkedList.unshift(value);
			this.currentNode = this.linkedList.head;
			return;
		}

		const node = new Node(value);
		node.next = this.currentNode.next;
		this.currentNode.next = node;
		this.previousNode = this.currentNode;
		this.currentNode = node;
	}

	public [Symbol.iterator]() {
		return this;
	}
}

/**
 * A singly-linked list.
 */
export class LinkedList<T> implements Iterable<Node<T>> {
	/**
	 * The first element of this linked list, or `undefined` if it does not
	 * exist.
	 */
	public head?: Node<T>;

	/**
	 * Adds a new node to the front of this linked list.
	 * @param value - Value to use.
	 */
	public unshift(value: T) {
		const node = new Node(value);
		node.next = this.head;
		this.head = node;
	}

	/**
	 * Removes the first element from this linked list.
	 *
	 * @throws If there was no first node.
	 * @returns The removed node.
	 */
	public shift() {
		if (!this.head) throw new Error('Tried to call removeFirst() when there was no head node.');
		const headNode = this.head;
		this.head = headNode.next;
		return headNode;
	}

	/**
	 * Clears this linked list.
	 */
	public clear() {
		this.head = undefined;
	}

	/**
	 * Whether this linked list is empty.
	 */
	public get isEmpty() {
		return this.head === undefined;
	}

	/**
	 * Converts this linked list to an array of its values.
	 */
	public array() {
		const values: T[] = [];
		for (const node of this) values.push(node.value);
		return values;
	}

	public *[Symbol.iterator]() {
		for (let node = this.head; node !== undefined; node = node.next) yield node;
	}

	/**
	 * Returns a `LinkedListIterator` over the elements of this linked list.
	 */
	public iter(): LinkedListIterator<T> {
		return new LinkedListIterator(this);
	}
}

/**
 * A single node in a linked list.
 */
export class Node<T> {
	/**
	 * Value that this node contains.
	 */
	public value: T;

	/**
	 * A link to the next node. This has the value `undefined` if there is no
	 * node after this one.
	 */
	public next?: Node<T>;

	/**
	 * Creates a new Node with the given data.
	 */
	public constructor(value: T) {
		this.value = value;
	}
}
