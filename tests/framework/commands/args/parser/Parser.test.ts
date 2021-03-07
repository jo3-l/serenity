import { Lexer } from '#framework/commands/args/Lexer';
import { Parser } from '#framework/commands/args/parser/Parser';
import type { ParserOutput } from '#framework/commands/args/parser/ParserOutput';
import { emptyOutput } from '#framework/commands/args/parser/ParserOutput';

class ParserImpl extends Parser {
	public next(output = emptyOutput()): IteratorResult<ParserOutput, undefined> {
		if (this.done) return { done: true, value: undefined };
		output.ordered.push(this.input[this.position]);
		this.advance(1);
		return { done: false, value: output };
	}
}

describe('Parser#setInput()', () => {
	it('should set the input', () => {
		const tokens = new Lexer().setInput('hello world').lex();
		const parser = new ParserImpl().setInput(tokens);

		expect(parser.next().value).toStrictEqual({
			ordered: [tokens[0]],
			flags: new Set(),
			options: new Map(),
		});
	});

	it('should reset the position', () => {
		const tokens = new Lexer().setInput('hello world').lex();
		const parser = new ParserImpl().setInput(tokens);
		parser.next();

		const tokens1 = new Lexer().setInput('foo bar').lex();
		parser.setInput(tokens1);

		expect(parser.next().value).toStrictEqual({
			ordered: [tokens1[0]],
			flags: new Set(),
			options: new Map(),
		});
	});
});

describe('Parser#done', () => {
	it('should be true when the parser is at the end of input', () => {
		expect(new ParserImpl().setInput([]).done).toBeTruthy();
	});

	it('should be false when the parser is not at the end of input', () => {
		const tokens = new Lexer().setInput('hello world').lex();

		expect(new ParserImpl().setInput(tokens).done).toBeFalsy();
	});
});

describe('Parser#reset()', () => {
	it('should reset the position', () => {
		const tokens = new Lexer().setInput('hello world').lex();
		const parser = new ParserImpl().setInput(tokens);

		expect(parser.next().value).toStrictEqual({
			ordered: [tokens[0]],
			flags: new Set(),
			options: new Map(),
		});

		parser.reset();

		expect(parser.next().value).toStrictEqual({
			ordered: [tokens[0]],
			flags: new Set(),
			options: new Map(),
		});
	});
});

describe('Parser#parse()', () => {
	it('should call next() and collect the results', () => {
		const tokens = new Lexer().setInput('hello world').lex();
		const parser = new ParserImpl().setInput(tokens);

		expect(parser.parse()).toStrictEqual({
			ordered: tokens,
			flags: new Set(),
			options: new Map(),
		});
	});
});

it('should be iterable', () => {
	const tokens = new Lexer().setInput('hello world').lex();
	const parser = new ParserImpl().setInput(tokens);
	const iterator = parser[Symbol.iterator]();

	expect(iterator.next().value).toStrictEqual({
		ordered: [tokens[0]],
		flags: new Set(),
		options: new Map(),
	});
	expect(iterator.next().value).toStrictEqual({
		ordered: [tokens[1]],
		flags: new Set(),
		options: new Map(),
	});
});
