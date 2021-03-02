/**
 * Most tests here are ported from 1Computer1's
 * [Lexure](https://github.com/1Computer1/lexure), licensed under the MIT
 * license.
 *
 * Copyright (c) 2020 1Computer.
 */
import { Lexer } from '#framework/commands/args/Lexer';

describe('Lexer#lex()', () => {
	it('should parse text without quotes', () => {
		const str = 'simple  text  \nhere';
		const tokens = new Lexer().setInput(str).lex();

		expect(tokens).toStrictEqual([
			{ value: 'simple', raw: 'simple', trailing: '  ' },
			{ value: 'text', raw: 'text', trailing: '  \n' },
			{ value: 'here', raw: 'here', trailing: '' },
		]);
	});

	it('should not special-case quoted text if no quotes are set', () => {
		const str = 'simple "text" here';
		const tokens = new Lexer().setInput(str).lex();

		expect(tokens).toStrictEqual([
			{ value: 'simple', raw: 'simple', trailing: ' ' },
			{ value: '"text"', raw: '"text"', trailing: ' ' },
			{ value: 'here', raw: 'here', trailing: '' },
		]);
	});

	describe('quoted text', () => {
		describe('one quote type', () => {
			it('should parse text without quotes', () => {
				const str = 'simple  text  \nhere';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([['"', '"']])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: '  ' },
					{ value: 'text', raw: 'text', trailing: '  \n' },
					{ value: 'here', raw: 'here', trailing: '' },
				]);
			});

			it('should parse text with quotes', () => {
				const str = 'simple "text" here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([['"', '"']])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: 'text', raw: '"text"', trailing: ' ' },
					{ value: 'here', raw: 'here', trailing: '' },
				]);
			});

			it('should parse text with unclosed quotes', () => {
				const str = 'simple "text here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([['"', '"']])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: '"text', raw: '"text', trailing: ' ' },
					{ value: 'here', raw: 'here', trailing: '' },
				]);
			});

			it('should parse text with quotes without spaces around them', () => {
				const str = 'simple"text"here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([['"', '"']])
					.lex();

				expect(tokens).toStrictEqual([{ value: 'simple"text"here', raw: 'simple"text"here', trailing: '' }]);
			});

			it('should parse text with spaces in quotes', () => {
				const str = 'simple "long text" here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([['"', '"']])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: 'long text', raw: '"long text"', trailing: ' ' },
					{ value: 'here', raw: 'here', trailing: '' },
				]);
			});
		});

		describe('multiple quote types', () => {
			it('should parse text without quotes', () => {
				const str = 'simple text here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([
						['"', '"'],
						['“', '”'],
					])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: 'text', raw: 'text', trailing: ' ' },
					{ value: 'here', raw: 'here', trailing: '' },
				]);
			});

			it('should parse text with unmatching quotes', () => {
				const str = 'simple "text” here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([
						['"', '"'],
						['“', '”'],
					])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: '"text”', raw: '"text”', trailing: ' ' },
					{ value: 'here', raw: 'here', trailing: '' },
				]);
			});

			it('should parse text with multiple quoted phrases', () => {
				const str = 'simple "text" “here”';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([
						['"', '"'],
						['“', '”'],
					])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: 'text', raw: '"text"', trailing: ' ' },
					{ value: 'here', raw: '“here”', trailing: '' },
				]);
			});

			it('should parse text with multiple unclosed quotes', () => {
				const str = 'simple "text “here';
				const tokens = new Lexer()
					.setInput(str)
					.setQuotes([
						['"', '"'],
						['“', '”'],
					])
					.lex();

				expect(tokens).toStrictEqual([
					{ value: 'simple', raw: 'simple', trailing: ' ' },
					{ value: '"text', raw: '"text', trailing: ' ' },
					{ value: '“here', raw: '“here', trailing: '' },
				]);
			});
		});
	});

	describe('backslashes', () => {
		it('should parse text with escaped characters', () => {
			const str = String.raw`\-hello "\\worl\d"`;
			const tokens = new Lexer()
				.setInput(str)
				.setQuotes([['"', '"']])
				.lex();

			expect(tokens).toStrictEqual([
				{ value: String.raw`\-hello`, raw: String.raw`\-hello`, trailing: ' ' },
				{ value: String.raw`\worl\d`, raw: String.raw`"\\worl\d"`, trailing: '' },
			]);
		});

		it('should parse text with escaped quotes and one quote type', () => {
			const str = String.raw`simple \"text "here"`;
			const tokens = new Lexer()
				.setInput(str)
				.setQuotes([['"', '"']])
				.lex();

			expect(tokens).toStrictEqual([
				{ value: 'simple', raw: 'simple', trailing: ' ' },
				{ value: '"text', raw: String.raw`\"text`, trailing: ' ' },
				{ value: 'here', raw: '"here"', trailing: '' },
			]);
		});

		it('should parse text with escaped quotes and multiple quote types', () => {
			const str = String.raw`simple "text\" “here\"\”`;
			const tokens = new Lexer()
				.setInput(str)
				.setQuotes([
					['"', '"'],
					['“', '”'],
				])
				.lex();
			expect(tokens).toStrictEqual([
				{ value: 'simple', raw: 'simple', trailing: ' ' },
				{ value: '"text"', raw: String.raw`"text\"`, trailing: ' ' },
				{ value: '“here"”', raw: String.raw`“here\"\”`, trailing: '' },
			]);
		});

		it('should parse text with escaped backslashes', () => {
			const str = String.raw`simple \\text here`;
			const tokens = new Lexer().setInput(str).lex();

			expect(tokens).toStrictEqual([
				{ value: 'simple', raw: 'simple', trailing: ' ' },
				{ value: String.raw`\text`, raw: String.raw`\\text`, trailing: ' ' },
				{ value: 'here', raw: 'here', trailing: '' },
			]);
		});
	});

	it('can handle leading spaces', () => {
		const str = ' simple text here';
		const tokens = new Lexer().setInput(str).lex();

		expect(tokens).toStrictEqual([
			{ value: 'simple', raw: 'simple', trailing: ' ' },
			{ value: 'text', raw: 'text', trailing: ' ' },
			{ value: 'here', raw: 'here', trailing: '' },
		]);
	});

	it('can handle empty strings', () => {
		const str = '';
		const tokens = new Lexer().setInput(str).lex();

		expect(tokens).toStrictEqual([]);
	});

	it('can handle just spaces', () => {
		const str = '   ';
		const tokens = new Lexer().setInput(str).lex();

		expect(tokens).toStrictEqual([]);
	});

	it('can handle a single character', () => {
		const str = 's';
		const tokens = new Lexer()
			.setInput(str)
			.setQuotes([['"', '"']])
			.lex();

		expect(tokens).toStrictEqual([{ value: 's', raw: 's', trailing: '' }]);
	});
});

describe('Lexer#reset()', () => {
	it('should reset the internal position', () => {
		const str = 'hello world';
		const lexer = new Lexer().setInput(str);
		expect(lexer.next().value?.value).toBe('hello');
		lexer.reset();
		expect(lexer.next().value?.value).toBe('hello');
	});
});
