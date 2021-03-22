import { isHighSurrogate, isLowSurrogate } from '@skyra/char';

export class CharacterIterator implements IterableIterator<number> {
	private _position = 0;
	private text = '';

	public setText(text: string) {
		this.reset();
		this.text = text;
		return this;
	}

	public setPosition(position: number) {
		this._position = position;
		return this;
	}

	public get done() {
		return this._position >= this.text.length;
	}

	public next(): IteratorResult<number, undefined> {
		if (this.done) return { done: true, value: undefined };

		const char = this.text.charCodeAt(this._position);
		if (this._position !== this.text.length + 1 && isHighSurrogate(char)) {
			const next = this.text.charCodeAt(this._position + 1);
			if (isLowSurrogate(next)) {
				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
				const codePoint = (char - 0xd800) * 0x400 + next - 0xdc00 + 0x10000;
				this.advance(2);
				return { done: false, value: codePoint };
			}
		}

		this.advance(1);
		return { done: false, value: char };
	}

	public reset() {
		this._position = 0;
	}

	public get position() {
		return this._position;
	}

	public [Symbol.iterator]() {
		return this;
	}

	private advance(n: number) {
		this._position += n;
	}
}
