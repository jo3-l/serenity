/**
 * An implementation of a bit set, useful for storing densely packed positive
 * integers.
 */
export class BitSet {
	private readonly bits: number[];

	/**
	 * Creates a new BitSet with enough capacity to store integers in the range
	 * `[0, n)`.
	 *
	 * @param n - The initial size of the bitset. Defaults to 32.
	 */
	public constructor(n = 32) {
		let length = n >> 5;
		if ((n & 0x1f) !== 0) ++length;
		this.bits = new Array(length).fill(0);
	}

	/**
	 * Checks whether the given integer is a member of this set.
	 *
	 * @param position - Position of the bit to check.
	 * @returns The value of the bit at the given position.
	 */
	public get(position: number) {
		const offset = position >>> 5;
		if (offset >= this.bits.length) return false;
		return (this.bits[offset] & (1 << position)) !== 0;
	}

	/**
	 * Adds the given integer to this bitset, growing as needed. This method
	 * does nothing if the bit at the position given is already set.
	 *
	 * @param position - Position of the bit to set.
	 */
	public set(position: number) {
		const offset = position >>> 5;
		this.ensure(offset);
		this.bits[offset] |= 1 << position;
	}

	/**
	 * Removes the given integer from this bitset. This method does nothing if
	 * the integer is not in the set.
	 *
	 * @param position - Position of the bit to clear.
	 */
	public clear(position: number) {
		const offset = position >>> 5;
		this.ensure(offset);
		this.bits[offset] &= ~(1 << position);
	}

	/**
	 * Toggles the bit at the given position.
	 *
	 * @param index - Index of the bit to toggle.
	 */
	public toggle(index: number) {
		const offset = index >>> 5;
		this.ensure(offset);
		this.bits[offset] ^= 1 << index;
	}

	private ensure(offset: number) {
		const delta = offset - this.bits.length;
		if (delta > 0) {
			for (let i = 0; i < delta; i++) this.bits.push(0);
		}
	}
}
