import { Lexer } from '#core/commands/args/Lexer';
import { VariadicFlagParser } from '#core/commands/args/parser/VariadicFlagParser';

describe('VariadicFlagParser#registerFlags()', () => {
	it('should register the flags given', () => {
		const parser = new VariadicFlagParser().registerFlags([
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

describe('VariadicFlagParser#registerOptions()', () => {
	it('should register the options given', () => {
		const parser = new VariadicFlagParser().registerOptions([
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

describe('VariadicFlagParser#parse()', () => {
	it('should discard tokens that are neither options nor flags', () => {
		const tokens = new Lexer().setInput('foo bar').lex();
		const output = new VariadicFlagParser().setInput(tokens).parse();

		expect(output).toStrictEqual({
			ordered: [],
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
			const output = new VariadicFlagParser()
				.registerFlags([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(['here']),
				options: new Map(),
			});
		});

		it('should not parse escaped flags', () => {
			const tokens = new Lexer().setInput('simple \\--text --hereAlias').lex();
			const output = new VariadicFlagParser()
				.registerFlags([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(['here']),
				options: new Map(),
			});
		});

		it('should parse flags and remap them to their IDs', () => {
			const tokens = new Lexer().setInput('simple --text --hereAlias').lex();
			const output = new VariadicFlagParser()
				.registerFlags([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(['text', 'here']),
				options: new Map(),
			});
		});

		it('should parse repetitions of the same flag', () => {
			const tokens = new Lexer().setInput('simple --text --text').lex();
			const output = new VariadicFlagParser()
				.registerFlags([{ id: 'text', prefixes: ['--text'] }])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
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
			const output = new VariadicFlagParser()
				.registerOptions([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(),
				options: new Map([['here', ['hello']]]),
			});
		});

		it('should not parse escaped options', () => {
			const tokens = new Lexer().setInput('simple \\--text hello --hereAlias why').lex();
			const output = new VariadicFlagParser()
				.registerOptions([
					{ id: 'text', prefixes: ['--text'] },
					{ id: 'here', prefixes: ['--here', '--hereAlias'] },
				])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(),
				options: new Map([['here', ['why']]]),
			});
		});

		it('should discard options with no value', () => {
			const tokens = new Lexer().setInput('simple text --here').lex();
			const output = new VariadicFlagParser()
				.registerOptions([{ id: 'here', prefixes: ['--here'] }])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(),
				options: new Map(),
			});
		});

		it('should parse options and remap them to their IDs', () => {
			const tokens = new Lexer()
				.setQuotes([['"', '"']])
				.setInput('simple --option hello world "foo" bar --otherOption "" --flag')
				.lex();
			const output = new VariadicFlagParser()
				.registerOptions([
					{ id: 'option', prefixes: ['--option'] },
					{ id: 'otherOption', prefixes: ['--otherOption'] },
				])
				.registerFlags([{ id: 'flag', prefixes: ['--flag'] }])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(['flag']),
				options: new Map([
					['option', ['hello world foo bar']],
					['otherOption', ['']],
				]),
			});
		});

		it('should parse repetitions of the same option', () => {
			const tokens = new Lexer().setInput('hello --option hello world --option foo bar').lex();
			const output = new VariadicFlagParser()
				.registerOptions([{ id: 'option', prefixes: ['--option'] }])
				.setInput(tokens)
				.parse();

			expect(output).toStrictEqual({
				ordered: [],
				flags: new Set(),
				options: new Map([['option', ['hello world', 'foo bar']]]),
			});
		});
	});
});

describe('VariadicFlagParser#next()', () => {
	it('should create and return a new output if none is given', () => {
		const tokens = new Lexer().setInput('--flag --option foo bar').lex();
		const parser = new VariadicFlagParser()
			.registerFlags([{ id: 'flag', prefixes: ['--flag'] }])
			.registerOptions([{ id: 'option', prefixes: ['--option'] }])
			.setInput(tokens);

		expect(parser.next().value).toStrictEqual({
			ordered: [],
			flags: new Set(['flag']),
			options: new Map(),
		});
		expect(parser.next().value).toStrictEqual({
			ordered: [],
			flags: new Set(),
			options: new Map([['option', ['foo bar']]]),
		});
	});

	it('should mutate the output object passed', () => {
		const tokens = new Lexer().setInput('--flag --option foo bar').lex();
		const parser = new VariadicFlagParser()
			.registerFlags([{ id: 'flag', prefixes: ['--flag'] }])
			.registerOptions([{ id: 'option', prefixes: ['--option'] }])
			.setInput(tokens);
		const result = parser.next();

		expect(result.value).toStrictEqual({
			ordered: [],
			flags: new Set(['flag']),
			options: new Map(),
		});
		expect(parser.next(result.value).value).toStrictEqual({
			ordered: [],
			flags: new Set(['flag']),
			options: new Map([['option', ['foo bar']]]),
		});
	});

	it('should return done: true if finished', () => {
		const parser = new VariadicFlagParser().setInput([]);
		expect(parser.next().done).toBeTruthy();
	});
});
