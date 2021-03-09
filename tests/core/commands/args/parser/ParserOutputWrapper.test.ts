import { Lexer } from '#core/commands/args/Lexer';
import { ParserOutputWrapper } from '#core/commands/args/parser/ParserOutputWrapper';
import { StandardParser } from '#core/commands/args/parser/StandardParser';
import { joinTokens } from '#core/commands/args/tokens';
import { err, none, ok, some } from '#utils/monads';

const numberTransformer = (value: string) => (/^\d+$/.test(value) ? some(Number(value)) : none);
const asyncNumberTransformer = (value: string) => Promise.resolve(/^\d+$/.test(value) ? some(Number(value)) : none);

const notNumberError = err('not a number');
const numberParser = (value: string) => (/^\d+$/.test(value) ? ok(Number(value)) : notNumberError);
const asyncNumberParser = (value: string) => Promise.resolve(/^\d+$/.test(value) ? ok(Number(value)) : notNumberError);

const infinityNotSupportedError = err('infinity not supported');
const asyncExtendedNumberParser = (value: string) => {
	if (value === 'infinity') return Promise.resolve(infinityNotSupportedError);
	if (!/^\d+$/.test(value)) return Promise.resolve(notNumberError);
	return Promise.resolve(ok(Number(value)));
};
const extendedNumberParser = (value: string) => {
	if (value === 'infinity') return infinityNotSupportedError;
	if (!/^\d+$/.test(value)) return notNumberError;
	return ok(Number(value));
};

function getOutputWrapper(
	input: string,
	{
		modifyLexer,
		modifyParser,
	}: {
		modifyLexer?: (lexer: Lexer) => void;
		modifyParser?: (parser: StandardParser) => void;
	} = {},
) {
	const lexer = new Lexer().setInput(input);
	modifyLexer?.(lexer);
	const parser = new StandardParser().setInput(lexer.lex());
	modifyParser?.(parser);
	return new ParserOutputWrapper(parser.parse());
}

describe('ParserOutputWrapper#done', () => {
	it('should be true when there are no more tokens', () => {
		expect(getOutputWrapper('').done).toBeTruthy();
	});

	it('should be false if there are more tokens', () => {
		expect(getOutputWrapper('hello world').done).toBeFalsy();
	});
});

describe('ParserOutputWrapper#length', () => {
	it('should be the number of ordered tokens', () => {
		const output = getOutputWrapper('hello world --foo bar', {
			modifyParser: (parser) => parser.registerOptions([{ id: 'foo', prefixes: ['--foo'] }]),
		});

		expect(output).toHaveLength(2);
		expect(getOutputWrapper('')).toHaveLength(0);
		expect(getOutputWrapper('hello world')).toHaveLength(2);
	});
});

describe('ParserOutputWrapper#position', () => {
	it('should start at 0', () => {
		expect(getOutputWrapper('hello world').position).toBe(0);
	});
});

describe('ParserOutputWrapper#positionFromEnd', () => {
	it('should start at the end of the ordered tokens', () => {
		expect(getOutputWrapper('hello world').positionFromEnd).toBe(1);
	});
});

describe('ParserOutputWrapper#hasFlag()', () => {
	it('should be true when there was a flag of that ID in the input', () => {
		const output = getOutputWrapper('hello world --foo', {
			modifyParser: (parser) => parser.registerFlags([{ id: 'foo', prefixes: ['--foo'] }]),
		});
		expect(output.hasFlag('foo')).toBeTruthy();
	});

	it('should be false when there was no flag of that ID in the input', () => {
		expect(getOutputWrapper('hello world').hasFlag('foo')).toBeFalsy();
	});
});

describe('ParserOutputWrapper#getOption()', () => {
	it('should only retrieve the last value by default', () => {
		const output = getOutputWrapper('hello world --option foo --option baz', {
			modifyParser: (parser) => parser.registerOptions([{ id: 'option', prefixes: ['--option'] }]),
		});
		expect(output.getOption('option')).toBe('baz');
	});

	it('should return all values if all = true', () => {
		const output = getOutputWrapper('hello world --option foo --option baz', {
			modifyParser: (parser) => parser.registerOptions([{ id: 'option', prefixes: ['--option'] }]),
		});
		expect(output.getOption('option', true)).toStrictEqual(['foo', 'baz']);
	});

	it('should return undefined if there was no option of that ID in the input', () => {
		expect(getOutputWrapper('hello world').getOption('option')).toBeUndefined();
	});
});

describe('ParserOutputWrapper#nextOrdered()', () => {
	it('should return undefined if there are no more tokens left', () => {
		expect(getOutputWrapper('').nextOrdered()).toBeUndefined();
	});

	describe('from start', () => {
		it('should retrieve from the start by default', () => {
			expect(getOutputWrapper('hello world').nextOrdered()).toBe('hello');
		});

		it('should increment the internal position', () => {
			const output = getOutputWrapper('foo bar baz buz');

			expect(output.nextOrdered()).toBe('foo');
			expect(output.position).toBe(1);
			expect(output.nextOrdered()).toBe('bar');
			expect(output.position).toBe(2);
		});

		it('should return the resolved value', () => {
			const output = getOutputWrapper('"foo bar" baz', {
				modifyLexer: (lexer) => lexer.setQuotes([['"', '"']]),
			});
			expect(output.nextOrdered()).toBe('foo bar');
		});

		it('should skip already used indices', () => {
			const output = getOutputWrapper('hello world foo bar');
			output.markAsUsed(0);

			expect(output.nextOrdered()).toBe('world');
			expect(output.position).toBe(2);
		});
	});

	describe('from end', () => {
		it('should decrement the internal position', () => {
			const output = getOutputWrapper('1 2 3');

			expect(output.nextOrdered(true)).toBe('3');
			expect(output.positionFromEnd).toBe(1);
			expect(output.nextOrdered(true)).toBe('2');
			expect(output.positionFromEnd).toBe(0);
		});

		it('should return the resolved value', () => {
			const output = getOutputWrapper('hello world "foo bar"', {
				modifyLexer: (lexer) => lexer.setQuotes([['"', '"']]),
			});

			expect(output.nextOrdered(true)).toBe('foo bar');
			expect(output.nextOrdered(true)).toBe('world');
		});

		it('should skip already used indices', () => {
			const output = getOutputWrapper('hello world foo bar');
			output.markAsUsed(3);
			expect(output.nextOrdered(true)).toBe('foo');
		});
	});

	it('should work if we take from both start and end', () => {
		const output = getOutputWrapper('1 2 3 4');

		expect(output.nextOrdered()).toBe('1');
		expect(output.nextOrdered(true)).toBe('4');
		expect(output.nextOrdered()).toBe('2');
		expect(output.nextOrdered(true)).toBe('3');
		expect(output.nextOrdered()).toBeUndefined();
		expect(output.nextOrdered(true)).toBeUndefined();

		expect(output.position).toBe(2);
		expect(output.positionFromEnd).toBe(1);
	});
});

describe('ParserOutputWrapper#retrieveMany()', () => {
	it('should return empty array if there are no more tokens', () => {
		expect(getOutputWrapper('').retrieveMany()).toStrictEqual([]);
	});

	describe('from start', () => {
		it('should use the current position in the forward direction by default', () => {
			const output = getOutputWrapper('1 2 3 4');
			output.nextOrdered();
			expect(joinTokens(output.retrieveMany())).toBe('2 3 4');
		});

		it('should use the position given if provided', () => {
			const output = getOutputWrapper('1 2 3 4');
			expect(joinTokens(output.retrieveMany({ startPosition: 1 }))).toBe('2 3 4');
		});

		it('should skip already used indices', () => {
			const output = getOutputWrapper('1 2 3 4');
			output.markAsUsed(0);
			expect(joinTokens(output.retrieveMany())).toBe('2 3 4');
		});

		it('should mark the tokens as used', () => {
			const output = getOutputWrapper('1 2 3 4');
			output.retrieveMany();
			expect(output.nextOrdered()).toBeUndefined();
		});

		it('should respect the limit', () => {
			const output = getOutputWrapper('1 2 3 4');
			// '3 ' because the 3rd token has trailing whitespace.
			expect(joinTokens(output.retrieveMany({ limit: 3 }))).toBe('1 2 3 ');
		});
	});

	describe('from end', () => {
		it('should use the current position in the opposite direction by default', () => {
			const output = getOutputWrapper('1 2 3 4');
			output.nextOrdered(true);

			// Space at the end since the 3rd token has trailing whitespace.
			expect(joinTokens(output.retrieveMany({ fromEnd: true }))).toBe('1 2 3 ');
		});

		it('should use the position given if provided', () => {
			const output = getOutputWrapper('1 2 3 4');

			// Space at the end since the 3rd token has trailing whitespace.
			expect(joinTokens(output.retrieveMany({ fromEnd: true, startPosition: 2 }))).toBe('1 2 3 ');
		});

		it('should skip already used indices', () => {
			const output = getOutputWrapper('1 2 3 4');
			output.markAsUsed(2);
			expect(joinTokens(output.retrieveMany({ fromEnd: true }))).toBe('1 2 4');
		});

		it('should mark the tokens as used', () => {
			const output = getOutputWrapper('1 2 3 4');
			output.retrieveMany();
			expect(output.nextOrdered(true)).toBeUndefined();
		});

		it('should respect the limit', () => {
			const output = getOutputWrapper('1 2 3 4');
			expect(joinTokens(output.retrieveMany({ fromEnd: true, limit: 3 }))).toBe('2 3 4');
		});
	});
});

describe('ParserOutputWrapper#mapNext()', () => {
	it('should return undefined if there are no more tokens', () => {
		expect(getOutputWrapper('').mapNext(numberTransformer)).toBeUndefined();
	});

	it('should map the next token using the function given', () => {
		expect(getOutputWrapper('123 456').mapNext(numberTransformer)).toStrictEqual(some(123));
		expect(getOutputWrapper('hello world').mapNext(numberTransformer)).toStrictEqual(none);
	});

	it('should skip already used tokens', () => {
		const output = getOutputWrapper('foo 123 baz buz');
		output.markAsUsed(0);

		expect(output.mapNext(numberTransformer)).toStrictEqual(some(123));
	});

	it('should mark the token as used only if the transformation succeeded by default', () => {
		const output = getOutputWrapper('foo 123 bar buz');
		output.mapNext(numberTransformer);
		expect(output.nextOrdered()).toBe('foo');

		output.mapNext(numberTransformer);
		expect(output.nextOrdered()).toBe('bar');
	});

	it('should always mark the token as used if alwaysUse = true', () => {
		const output = getOutputWrapper('foo 123 234 buz');
		output.mapNext(numberTransformer, true);

		expect(output.nextOrdered()).toBe('123');
		expect(output.mapNext(numberTransformer)).toStrictEqual(some(234));
	});
});

describe('ParserOutputWrapper#mapNextAsync()', () => {
	it('should return undefined if there are no more tokens', () => {
		return expect(getOutputWrapper('').mapNextAsync(asyncNumberTransformer)).resolves.toBeUndefined();
	});

	it('should map the next token using the function given', async () => {
		await expect(getOutputWrapper('123 456').mapNextAsync(asyncNumberTransformer)).resolves.toStrictEqual(some(123));
		await expect(getOutputWrapper('hello world').mapNextAsync(asyncNumberTransformer)).resolves.toStrictEqual(none);
	});

	it('should skip already used tokens', async () => {
		const output = getOutputWrapper('foo 123 baz buz');
		output.markAsUsed(0);
		await expect(output.mapNextAsync(asyncNumberTransformer)).resolves.toStrictEqual(some(123));
	});

	it('should mark the token as used only if the transformation succeeded by default', async () => {
		const output = getOutputWrapper('foo 123 bar buz');
		await output.mapNextAsync(asyncNumberTransformer);
		expect(output.nextOrdered()).toBe('foo');

		await output.mapNextAsync(asyncNumberTransformer);
		expect(output.nextOrdered()).toBe('bar');
	});

	it('should always mark the token as used if alwaysUse = true', async () => {
		const output = getOutputWrapper('foo 123 234 buz');
		await output.mapNextAsync(asyncNumberTransformer, true);

		expect(output.nextOrdered()).toBe('123');
		await expect(output.mapNextAsync(asyncNumberTransformer)).resolves.toStrictEqual(some(234));
	});
});

describe('ParserOutputWrapper#parseNext()', () => {
	it('should return undefined if there are no more tokens', () => {
		expect(getOutputWrapper('').parseNext(numberParser)).toBeUndefined();
	});

	it('should parse the next token using the function given', () => {
		expect(getOutputWrapper('123 456').parseNext(numberParser)).toStrictEqual(ok(123));
		expect(getOutputWrapper('hello world').parseNext(numberParser)).toStrictEqual(notNumberError);
	});

	it('should skip already used tokens', () => {
		const output = getOutputWrapper('foo 123 baz buz');
		output.markAsUsed(0);
		expect(output.parseNext(numberParser)).toStrictEqual(ok(123));
	});

	it('should mark the token as used only if the transformation succeeded by default', () => {
		const output = getOutputWrapper('foo 123 bar buz');
		output.parseNext(numberParser);
		expect(output.nextOrdered()).toBe('foo');

		output.parseNext(numberParser);
		expect(output.nextOrdered()).toBe('bar');
	});

	it('should always mark the token as used if alwaysUse = true', () => {
		const output = getOutputWrapper('foo 123 234 buz');
		output.parseNext(numberParser, true);

		expect(output.nextOrdered()).toBe('123');
		expect(output.parseNext(numberParser)).toStrictEqual(ok(234));
	});
});

describe('ParserOutputWrapper#parseNextAsync()', () => {
	it('should return undefined if there are no more tokens', async () => {
		return expect(getOutputWrapper('').parseNextAsync(asyncNumberParser)).resolves.toBeUndefined();
	});

	it('should parse the next token using the function given', async () => {
		await expect(getOutputWrapper('123 456').parseNextAsync(asyncNumberParser)).resolves.toStrictEqual(ok(123));
		await expect(getOutputWrapper('hello world').parseNextAsync(asyncNumberParser)).resolves.toStrictEqual(
			notNumberError,
		);
	});

	it('should skip already used tokens', async () => {
		const output = getOutputWrapper('foo 123 baz buz');
		output.markAsUsed(0);

		await expect(output.parseNextAsync(asyncNumberParser)).resolves.toStrictEqual(ok(123));
	});

	it('should mark the token as used only if the transformation succeeded by default', async () => {
		const output = getOutputWrapper('foo 123 bar buz');
		await output.parseNextAsync(asyncNumberParser);
		expect(output.nextOrdered()).toBe('foo');

		await output.parseNextAsync(asyncNumberParser);
		expect(output.nextOrdered()).toBe('bar');
	});

	it('should always mark the token as used if alwaysUse = true', async () => {
		const output = getOutputWrapper('foo 123 234 buz');
		await output.parseNextAsync(asyncNumberParser, true);

		expect(output.nextOrdered()).toBe('123');
		await expect(output.parseNextAsync(asyncNumberParser)).resolves.toStrictEqual(ok(234));
	});
});

describe('ParserOutputWrapper#mapWhile()', () => {
	it('should return an empty list if there are no more tokens', () => {
		expect(getOutputWrapper('').mapWhile(numberTransformer)).toStrictEqual([]);
	});

	it('should map tokens', () => {
		const output = getOutputWrapper('123 456 789');
		expect(output.mapWhile(numberTransformer)).toStrictEqual([123, 456, 789]);
	});

	it('should stop when it reaches a value that failed the transformation', () => {
		expect(getOutputWrapper('123 456 hello 789').mapWhile(numberTransformer)).toStrictEqual([123, 456]);
	});

	it('should ignore tokens that are already used', () => {
		const output = getOutputWrapper('123 world 234 456 baz');
		output.markAsUsed(1);
		expect(output.mapWhile(numberTransformer)).toStrictEqual([123, 234, 456]);
	});

	it('should start searching from the current position by default', () => {
		const output = getOutputWrapper('abc 123 234 456');
		output.nextOrdered();
		expect(output.mapWhile(numberTransformer)).toStrictEqual([123, 234, 456]);
	});

	it('should start searching from the given position if one was passed', () => {
		const output = getOutputWrapper('hello world 123 234 456');
		expect(output.mapWhile(numberTransformer, { startPosition: 2 })).toStrictEqual([123, 234, 456]);
	});

	it('should respect the limit given', () => {
		const output = getOutputWrapper('123 234 345 456');
		expect(output.mapWhile(numberTransformer, { limit: 3 })).toStrictEqual([123, 234, 345]);
	});

	it('should only mark tokens that passed the transformation as used by default', () => {
		const output = getOutputWrapper('123 234 345 hello');
		output.mapWhile(numberTransformer);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they passed the transformation if alwaysUse = true', () => {
		const output = getOutputWrapper('123 234 345 hello');
		output.mapWhile(numberTransformer, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('ParserOutputWrapper#mapWhileAsync()', () => {
	it('should return an empty list if there are no more tokens', () => {
		const output = getOutputWrapper('');
		return expect(output.mapWhileAsync(asyncNumberTransformer)).resolves.toStrictEqual([]);
	});

	it('should map tokens', async () => {
		const output = getOutputWrapper('123 456 789');
		await expect(output.mapWhileAsync(asyncNumberTransformer)).resolves.toStrictEqual([123, 456, 789]);
	});

	it('should stop when it reaches a value that failed the transformation', async () => {
		const output = getOutputWrapper('123 456 hello 789');
		await expect(output.mapWhileAsync(asyncNumberTransformer)).resolves.toStrictEqual([123, 456]);
	});

	it('should ignore tokens that are already used', async () => {
		const output = getOutputWrapper('123 world 234 456 baz');
		output.markAsUsed(1);
		await expect(output.mapWhileAsync(asyncNumberTransformer)).resolves.toStrictEqual([123, 234, 456]);
	});

	it('should start searching from the current position by default', async () => {
		const output = getOutputWrapper('abc 123 234 456');
		output.nextOrdered();
		await expect(output.mapWhileAsync(asyncNumberTransformer)).resolves.toStrictEqual([123, 234, 456]);
	});

	it('should start searching from the given position if one was passed', async () => {
		const output = getOutputWrapper('hello world 123 234 456');
		await expect(output.mapWhileAsync(asyncNumberTransformer, { startPosition: 2 })).resolves.toStrictEqual([
			123,
			234,
			456,
		]);
	});

	it('should respect the limit given', async () => {
		const output = getOutputWrapper('123 234 345 456');
		await expect(output.mapWhileAsync(asyncNumberTransformer, { limit: 3 })).resolves.toStrictEqual([123, 234, 345]);
	});

	it('should only mark tokens that passed the transformation as used by default', async () => {
		const output = getOutputWrapper('123 234 345 hello');
		await output.mapWhileAsync(asyncNumberTransformer);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they passed the transformation if alwaysUse = true', async () => {
		const output = getOutputWrapper('123 234 345 hello');
		await output.mapWhileAsync(asyncNumberTransformer, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('ParserOutputWrapper#findMap()', () => {
	it('should return nothing if there are no more tokens', () => {
		expect(getOutputWrapper('').findMap(numberTransformer)).toStrictEqual(none);
	});

	it('should return the first value that could be transformed successfully', () => {
		const output = getOutputWrapper('hello world 123 :D 234');
		expect(output.findMap(numberTransformer)).toStrictEqual(some(123));
	});

	it('should return nothing if it could not find a token', () => {
		const output = getOutputWrapper('hello world foo bar baz');
		expect(output.findMap(numberTransformer)).toStrictEqual(none);
	});

	it('should ignore tokens that are already used', () => {
		const output = getOutputWrapper('hello world foo 123 bar baz 234');
		output.markAsUsed(3);
		expect(output.findMap(numberTransformer)).toStrictEqual(some(234));
	});

	it('should start searching from the current position by default', () => {
		const output = getOutputWrapper('123 hello world 234');
		output.nextOrdered();
		expect(output.findMap(numberTransformer)).toStrictEqual(some(234));
	});

	it('should start searching from the given position if one was passed', () => {
		const output = getOutputWrapper('hello world 123 234');
		expect(output.findMap(numberTransformer, { startPosition: 3 })).toStrictEqual(some(234));
	});

	it('should only mark tokens that passed the transformation as used by default', () => {
		const output = getOutputWrapper('hello world 123');
		output.findMap(numberTransformer);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they passed the transformation if alwaysUse = true', () => {
		const output = getOutputWrapper('hello world 123');
		output.findMap(numberTransformer, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('ParserOutputWrapper#findMapAsync()', () => {
	it('should return nothing if there are no more tokens', async () => {
		return expect(getOutputWrapper('').findMapAsync(asyncNumberTransformer)).resolves.toStrictEqual(none);
	});

	it('should return the first value that could be transformed successfully', async () => {
		const output = getOutputWrapper('hello world 123 :D 234');
		await expect(output.findMapAsync(asyncNumberTransformer)).resolves.toStrictEqual(some(123));
	});

	it('should return nothing if it could not find a token', async () => {
		const output = getOutputWrapper('hello world foo bar baz');
		await expect(output.findMapAsync(asyncNumberTransformer)).resolves.toStrictEqual(none);
	});

	it('should ignore tokens that are already used', async () => {
		const output = getOutputWrapper('hello world foo 123 bar baz 234');
		output.markAsUsed(3);
		await expect(output.findMapAsync(asyncNumberTransformer)).resolves.toStrictEqual(some(234));
	});

	it('should start searching from the current position by default', async () => {
		const output = getOutputWrapper('123 hello world 234');
		output.nextOrdered();
		await expect(output.findMapAsync(asyncNumberTransformer)).resolves.toStrictEqual(some(234));
	});

	it('should start searching from the given position if one was passed', async () => {
		const output = getOutputWrapper('hello world 123 234');
		await expect(output.findMapAsync(asyncNumberTransformer, { startPosition: 3 })).resolves.toStrictEqual(some(234));
	});

	it('should only mark tokens that passed the transformation as used by default', async () => {
		const output = getOutputWrapper('hello world 123');
		await output.findMapAsync(asyncNumberTransformer);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they passed the transformation if alwaysUse = true', async () => {
		const output = getOutputWrapper('hello world 123');
		await output.findMapAsync(asyncNumberTransformer, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('ParserOutputWrapper#findParse()', () => {
	it('should return an empty list of errors if there are no more tokens', () => {
		expect(getOutputWrapper('').findParse(numberParser)).toStrictEqual(err([]));
	});

	it('should return the first value that could be parsed successfully', () => {
		const output = getOutputWrapper('hello world 123 :D 234');
		expect(output.findParse(numberParser)).toStrictEqual(ok(123));
	});

	it('should return a list of errors in order if it could not find a token', () => {
		const output = getOutputWrapper('hello world infinity foo bar baz');
		expect(output.findParse(extendedNumberParser)).toStrictEqual(
			err(
				[notNumberError, notNumberError, infinityNotSupportedError, notNumberError, notNumberError, notNumberError].map(
					(result) => result.error,
				),
			),
		);
	});

	it('should ignore tokens that are already used', () => {
		const output = getOutputWrapper('hello world foo 123 bar baz 234');
		output.markAsUsed(3);
		expect(output.findParse(numberParser)).toStrictEqual(ok(234));
	});

	it('should start searching from the current position by default', () => {
		const output = getOutputWrapper('123 hello world 234');
		output.nextOrdered();
		expect(output.findParse(numberParser)).toStrictEqual(ok(234));
	});

	it('should start searching from the given position if one was passed', () => {
		const output = getOutputWrapper('hello world 123 234');
		expect(output.findParse(numberParser, { startPosition: 3 })).toStrictEqual(ok(234));
	});

	it('should only mark tokens that were parsed successfully as used by default', () => {
		const output = getOutputWrapper('hello world 123');
		output.findParse(numberParser);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they were parsed successfully if alwaysUse = true', () => {
		const output = getOutputWrapper('hello world 123');
		output.findParse(numberParser, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('ParserOutputWrapper#findParseAsync()', () => {
	it('should return an empty list of errors if there are no more tokens', async () => {
		return expect(getOutputWrapper('').findParseAsync(asyncExtendedNumberParser)).resolves.toStrictEqual(err([]));
	});

	it('should return the first value that could be parsed successfully', async () => {
		const output = getOutputWrapper('hello world 123 :D 234');
		await expect(output.findParseAsync(asyncExtendedNumberParser)).resolves.toStrictEqual(ok(123));
	});

	it('should return nothing if it could not find a token', async () => {
		const output = getOutputWrapper('hello world infinity foo bar baz');
		await expect(output.findParseAsync(asyncExtendedNumberParser)).resolves.toStrictEqual(
			err(
				[notNumberError, notNumberError, infinityNotSupportedError, notNumberError, notNumberError, notNumberError].map(
					(result) => result.error,
				),
			),
		);
	});

	it('should ignore tokens that are already used', async () => {
		const output = getOutputWrapper('hello world foo 123 bar baz 234');
		output.markAsUsed(3);
		await expect(output.findParseAsync(asyncExtendedNumberParser)).resolves.toStrictEqual(ok(234));
	});

	it('should start searching from the current position by default', async () => {
		const output = getOutputWrapper('123 hello world 234');
		output.nextOrdered();
		await expect(output.findParseAsync(asyncExtendedNumberParser)).resolves.toStrictEqual(ok(234));
	});

	it('should start searching from the given position if one was passed', async () => {
		const output = getOutputWrapper('hello world 123 234');
		await expect(output.findParseAsync(asyncExtendedNumberParser, { startPosition: 3 })).resolves.toStrictEqual(
			ok(234),
		);
	});

	it('should only mark tokens that were parsed successfully as used by default', async () => {
		const output = getOutputWrapper('hello world 123');
		await output.findParseAsync(asyncExtendedNumberParser);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether parsing succeed if alwaysUse = true', async () => {
		const output = getOutputWrapper('hello world 123');
		await output.findParseAsync(asyncExtendedNumberParser, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

// #region

describe('ParserOutputWrapper#filterMap()', () => {
	it('should return an empty list if there are no more tokens', () => {
		expect(getOutputWrapper('').filterMap(numberTransformer)).toStrictEqual([]);
	});

	it('should return a list of values that could be transformed successfully', () => {
		const output = getOutputWrapper('hello world 123 :D 234');
		expect(output.filterMap(numberTransformer)).toStrictEqual([123, 234]);
	});

	it('should respect the limit', () => {
		const output = getOutputWrapper('hello world 123 234 345');
		expect(output.filterMap(numberTransformer, { limit: 2 })).toStrictEqual([123, 234]);
	});

	it('should return an empty list if it could not find a token', () => {
		const output = getOutputWrapper('hello world foo bar baz');
		expect(output.filterMap(numberTransformer)).toStrictEqual([]);
	});

	it('should ignore tokens that are already used', () => {
		const output = getOutputWrapper('hello world foo 123 bar baz 234');
		output.markAsUsed(3);
		expect(output.filterMap(numberTransformer)).toStrictEqual([234]);
	});

	it('should start searching from the current position by default', () => {
		const output = getOutputWrapper('123 hello world 234');
		output.nextOrdered();
		expect(output.filterMap(numberTransformer)).toStrictEqual([234]);
	});

	it('should start searching from the given position if one was passed', () => {
		const output = getOutputWrapper('hello world 123 234');
		expect(output.filterMap(numberTransformer, { startPosition: 3 })).toStrictEqual([234]);
	});

	it('should only mark tokens that passed the transformation as used by default', () => {
		const output = getOutputWrapper('hello world 123');
		output.filterMap(numberTransformer);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they passed the transformation if alwaysUse = true', () => {
		const output = getOutputWrapper('hello world 123');
		output.filterMap(numberTransformer, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('ParserOutputWrapper#filterMapAsync()', () => {
	it('should return an empty list if there are no more tokens', async () => {
		return expect(getOutputWrapper('').filterMapAsync(asyncNumberTransformer)).resolves.toStrictEqual([]);
	});

	it('should return a list of values that could be transformed successfully', async () => {
		const output = getOutputWrapper('hello world 123 :D 234');
		await expect(output.filterMapAsync(asyncNumberTransformer)).resolves.toStrictEqual([123, 234]);
	});

	it('should respect the limit', async () => {
		const output = getOutputWrapper('hello world 123 234 345');
		await expect(output.filterMapAsync(asyncNumberTransformer, { limit: 2 })).resolves.toStrictEqual([123, 234]);
	});

	it('should return an empty list if it could not find a token', async () => {
		const output = getOutputWrapper('hello world foo bar baz');
		await expect(output.filterMapAsync(asyncNumberTransformer)).resolves.toStrictEqual([]);
	});

	it('should ignore tokens that are already used', async () => {
		const output = getOutputWrapper('hello world foo 123 bar baz 234');
		output.markAsUsed(3);
		await expect(output.filterMapAsync(asyncNumberTransformer)).resolves.toStrictEqual([234]);
	});

	it('should start searching from the current position by default', async () => {
		const output = getOutputWrapper('123 hello world 234');
		output.nextOrdered();
		await expect(output.filterMapAsync(asyncNumberTransformer)).resolves.toStrictEqual([234]);
	});

	it('should start searching from the given position if one was passed', async () => {
		const output = getOutputWrapper('hello world 123 234');
		await expect(output.filterMapAsync(asyncNumberTransformer, { startPosition: 3 })).resolves.toStrictEqual([234]);
	});

	it('should only mark tokens that passed the transformation as used by default', async () => {
		const output = getOutputWrapper('hello world 123');
		await output.filterMapAsync(asyncNumberTransformer);
		expect(output.nextOrdered()).toBe('hello');
	});

	it('should mark tokens as used regardless of whether they passed the transformation if alwaysUse = true', async () => {
		const output = getOutputWrapper('hello world 123');
		await output.filterMapAsync(asyncNumberTransformer, { alwaysUse: true });
		expect(output.nextOrdered()).toBeUndefined();
	});
});

describe('save/restore', () => {
	describe('restore', () => {
		it('should do nothing if there is no saved state', () => {
			const output = getOutputWrapper('hello world 123');
			output.nextOrdered();
			output.reset();

			expect(output.nextOrdered()).toBe('world');
		});

		it('should reset to the most recently saved state', () => {
			const output = getOutputWrapper('hello world 123');
			output.save();
			output.nextOrdered();
			output.reset();

			expect(output.nextOrdered()).toBe('hello');
		});

		it('should clear the saved state once the reset is complete', () => {
			const output = getOutputWrapper('hello world 123');
			output.save();
			output.nextOrdered();
			output.reset();

			expect(output.nextOrdered()).toBe('hello');
			output.reset();

			expect(output.nextOrdered()).toBe('world');
		});
	});
});
