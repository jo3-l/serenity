import { Lexer } from '#framework/commands/args/Lexer';
import { StandardParser } from '#framework/commands/args/parser/StandardParser';

describe('StandardParser#registerFlags()', () => {
	it('should register the flags given', () => {
		const parser = new StandardParser().registerFlags([
			{ id: 'myFlag', prefixes: ['--myFlag', '-m'] },
			{ id: 'ourFlag', prefixes: ['--ourFlag', '-o'] },
		]);
		expect(parser.registeredFlags).toStrictEqual(
			new Map([
				['--myFlag', 'myFlag'],
				['--ourFlag', 'ourFlag'],
				['-m', 'myFlag'],
				['-o', 'ourFlag'],
			]),
		);
	});
});

describe('StandardParser#registerOptions()', () => {
	it('should register the options given', () => {
		const parser = new StandardParser().registerOptions([
			{ id: 'myFlag', prefixes: ['--myFlag', '-m'] },
			{ id: 'ourFlag', prefixes: ['--ourFlag', '-o'] },
		]);
		expect(parser.registeredOptions).toStrictEqual(
			new Map([
				['--myFlag', 'myFlag'],
				['--ourFlag', 'ourFlag'],
				['-m', 'myFlag'],
				['-o', 'ourFlag'],
			]),
		);
	});
});

describe('StandardParser#parse()', () => {
	it('should parse normal phrases', () => {
		const tokens = new Lexer().setInput('simple text here').lex();
		const output = new StandardParser().setInput(tokens).parse();
		expect(output).toMatchObject({
			ordered: tokens,
			flags: new Set(),
			options: new Map(),
		});
	});

	describe('flags', () => {
		it('should not parse quoted flags', () => {
			const tokens = new Lexer()
				.setQuotes([['"', '"']])
				.setInput('simple "--text" --hereAlias')
				.lex();
			const output = new StandardParser()
				.registerFlags([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0], tokens[1]],
				flags: new Set(['here']),
				options: new Map(),
			});
		});

		it('should not parse escaped flags', () => {
			const tokens = new Lexer().setInput('simple \\--text --hereAlias').lex();
			const output = new StandardParser()
				.registerFlags([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0], tokens[1]],
				flags: new Set(['here']),
				options: new Map(),
			});
		});

		it('should parse flags and remap them to their IDs', () => {
			const tokens = new Lexer().setInput('simple --text --hereAlias').lex();
			const output = new StandardParser()
				.registerFlags([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0]],
				flags: new Set(['text', 'here']),
				options: new Map(),
			});
		});

		it('should parse repetitions of the same flag', () => {
			const tokens = new Lexer().setInput('simple --text --text').lex();
			const output = new StandardParser()
				.registerFlags([{ id: 'text', prefixes: ['--text'] }])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0]],
				flags: new Set(['text']),
				options: new Map(),
			});
		});
	});

	describe('options', () => {
		it('should not parse quoted options', () => {
			const tokens = new Lexer()
				.setQuotes([['"', '"']])
				.setInput('simple "--text" why --hereAlias hello')
				.lex();
			const output = new StandardParser()
				.registerOptions([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0], tokens[1], tokens[2]],
				flags: new Set(),
				options: new Map([['here', ['hello']]]),
			});
		});

		it('should not parse escaped options', () => {
			const tokens = new Lexer().setInput('simple \\--text hello --hereAlias why').lex();
			const output = new StandardParser()
				.registerOptions([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0], tokens[1], tokens[2]],
				flags: new Set(),
				options: new Map([['here', ['why']]]),
			});
		});

		it('should discard options with no value', () => {
			const tokens = new Lexer().setInput('simple text --here').lex();
			const output = new StandardParser()
				.registerOptions([{ id: 'here', prefixes: ['--here'] }])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0], tokens[1]],
				flags: new Set(),
				options: new Map(),
			});
		});

		it('should parse options and remap them to their IDs', () => {
			const tokens = new Lexer().setInput('simple --text hello --hereAlias why').lex();
			const output = new StandardParser()
				.registerOptions([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0]],
				flags: new Set(),
				options: new Map([
					['text', ['hello']],
					['here', ['why']],
				]),
			});
		});

		it('should parse repetitions of the same option', () => {
			const tokens = new Lexer().setInput('simple --text hello --hereAlias why --text there').lex();
			const output = new StandardParser()
				.registerOptions([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toMatchObject({
				ordered: [tokens[0]],
				flags: new Set(),
				options: new Map([
					['text', ['hello', 'there']],
					['here', ['why']],
				]),
			});
		});
	});
});
