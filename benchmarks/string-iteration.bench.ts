import { CharacterIterator } from '#lib/moderation/filter/preprocessor/CharacterIterator';

import { benchmarks } from './wrapper';

import { isHighSurrogate, isLowSurrogate } from '@skyra/char';

function toCodePoints(text: string) {
	const codePoints: number[] = [];
	let i = 0;
	while (i < text.length) {
		const first = text.charCodeAt(i);
		if (i !== text.length - 1 && isHighSurrogate(first)) {
			const second = text.charCodeAt(i + 1);

			if (isLowSurrogate(second)) {
				codePoints.push((first - 0xd800) * 0x400 + second - 0xdc00 + 0x10000);
			} else {
				codePoints.push(first, second);
			}

			i += 2;
		} else {
			codePoints.push(first);
			++i;
		}
	}

	return codePoints;
}

benchmarks((suite) => {
	suite('iterate over string', (add) => {
		for (const length of [5, 10, 50, 250, 500, 2000]) {
			add(`iterate over ascii string of ${length} length using for-loop and charCodeAt`, () => {
				const str = 'b'.repeat(length);
				return () => {
					let v = 0;
					for (let i = 0; i < str.length; i++) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const char = str.charCodeAt(i);
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						++v;
					}
				};
			});

			add(`iterate over string of ${length} length using CharacterIterator (for-of loop)`, () => {
				const str = '𝌆'.repeat(length);
				return () => {
					const iterator = new CharacterIterator().setText(str);
					let i = 0;
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					for (const value of iterator) ++i;
				};
			});

			add(`iterate over string of ${length} length using CharacterIterator (while-loop)`, () => {
				const str = '𝌆'.repeat(length);
				return () => {
					const iterator = new CharacterIterator().setText(str);
					let i = 0;
					let v = iterator.next();
					while (!v.done) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						++i;
						v = iterator.next();
					}
				};
			});

			add(`iterate over string of ${length} length using array`, () => {
				const str = '𝌆'.repeat(length);
				return () => {
					const codePoints = toCodePoints(str);
					let i = 0;
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					for (const value of codePoints) ++i;
				};
			});

			add(`iterate over string of ${length} length using codePointAt & check for undefined`, () => {
				const str = '𝌆'.repeat(length);
				return () => {
					let v = 0;
					for (let i = 0, c = str.codePointAt(i); c !== undefined; c = str.codePointAt(++i)) {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						++v;
					}
				};
			});
		}
	});
});
