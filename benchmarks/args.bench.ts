import { Lexer } from '#core/commands/args/Lexer';
import { StandardParser } from '#core/commands/args/parser/StandardParser';
import { VariadicFlagParser } from '#core/commands/args/parser/VariadicFlagParser';
import type { Token } from '#core/commands/args/tokens';

import { benchmarks } from './wrapper';

function generateStandardParserInput() {
	const input: Token[] = [];
	let i = 0;
	while (i < 500) {
		if (i % 5 === 0) {
			input.push({ value: '--flag', raw: '--flag', trailing: ' ' });
			++i;
		} else if (i % 3 === 0) {
			input.push(
				{ value: '--option-alias', raw: '--option-alias', trailing: ' ' },
				{ value: 'some value', raw: '"some value"', trailing: '   ' },
			);
			i += 2;
		} else {
			input.push({ value: 'hello world', raw: 'hello world', trailing: ' ' });
			++i;
		}
	}

	return input;
}

function generateVariadicFlagParserInput() {
	const input: Token[] = [];
	let i = 0;
	while (i < 500) {
		if (i % 5 === 0) {
			input.push({ value: '--flag', raw: '--flag', trailing: ' ' });
			++i;
		} else if (i % 3 === 0) {
			input.push(
				{ value: '--option-alias', raw: '--option-alias', trailing: ' ' },
				{ value: 'some value', raw: '"some value"', trailing: '   ' },
				{ value: 'more value', raw: '"more value"', trailing: ' ' },
				{ value: 'even more values', raw: 'even more values', trailing: '' },
			);
			i += 4;
		} else {
			input.push({ value: 'hello world', raw: 'hello world', trailing: ' ' });
			++i;
		}
	}

	return input;
}

benchmarks((suite) => {
	suite('lexing: lex string with double quotes', (add) => {
		let str = '';
		for (let i = 0; i < 2000; i++) {
			if (i % 23 === 0) str += 'v';
			else if (i % 11 === 0) str += '"';
			else if (i % 5 === 0) str += ' ';
			else str += 'h';
		}

		add('Lexer#lex() with 2000 length string', () => {
			const lexer = new Lexer().setQuotes([['"', '"']]).setInput(str);
			lexer.lex();
		});
	});

	suite('parsing: parse tokens with options, flags and ordered arguments', (add) => {
		const standardParserInput = generateStandardParserInput();
		const variadicFlagParserInput = generateVariadicFlagParserInput();

		add('StandardParser#parse() with 500 tokens', () => {
			const parser = new StandardParser()
				.registerFlags([{ id: 'flag', prefixes: ['--flag', '--flag-alias'] }])
				.registerOptions([{ id: 'option', prefixes: ['--option', '--option-alias'] }])
				.setInput(standardParserInput);

			parser.parse();
		});

		add('VariadicFlagParser#parse() with 500 tokens', () => {
			const parser = new VariadicFlagParser()
				.registerFlags([{ id: 'flag', prefixes: ['--flag', '--flag-alias'] }])
				.registerOptions([{ id: 'option', prefixes: ['--option', '--option-alias'] }])
				.setInput(variadicFlagParserInput);

			parser.parse();
		});
	});
});
