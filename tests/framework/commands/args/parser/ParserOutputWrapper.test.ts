import { Lexer } from '#framework/commands/args/Lexer';
import { ParserOutputWrapper } from '#framework/commands/args/parser/ParserOutputWrapper';
import { StandardParser } from '#framework/commands/args/parser/StandardParser';
import { joinTokens } from '#framework/commands/args/tokens';
import { err, none, ok, some } from '#utils/monads';

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
	});
});

describe('ParserOutputWrapper#mapNext()', () => {
	const numberTransformer = (value: string) => (/^\d+$/.test(value) ? some(Number(value)) : none);

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
	const asyncNumberTransformer = (value: string) => Promise.resolve(/^\d+$/.test(value) ? some(Number(value)) : none);

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

describe('ParserOutput#parseNext()', () => {
	const notNumberError = err('not a number');
	const numberParser = (value: string) => (/^\d+$/.test(value) ? ok(Number(value)) : notNumberError);

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

describe('ParserOutput#parseNextAsync()', () => {
	const notNumberError = err('not a number');
	const asyncNumberParser = (value: string) =>
		Promise.resolve(/^\d+$/.test(value) ? ok(Number(value)) : notNumberError);

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
