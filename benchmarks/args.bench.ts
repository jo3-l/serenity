import { Lexer } from '#core/commands/args/Lexer';
import { StandardParser } from '#core/commands/args/parser/StandardParser';
import { VariadicFlagParser } from '#core/commands/args/parser/VariadicFlagParser';
import type { Token } from '#core/commands/args/tokens';

import { benchmarks } from './wrapper';

benchmarks((suite) => {
	suite('lex string with double quotes and escaped characters', (add) => {
		add.each([[20], [100], [250], [500], [1000], [2000]])(
			(length) => `lex string with ${length} length using Lexer`,
			(length) => {
				let str = '';
				for (let i = 0; i < length; i++) {
					if (i % 11 === 0) str += '"';
					else if (i % 7 === 0) str += '\\';
					else if (i % 5 === 0) str += ' ';
					else str += 'h';
				}
				const lexer = new Lexer().setQuotes([['"', '"']]).setInput(str);

				return () => void lexer.lex();
			},
		);
	});

	suite('parse tokens with options, flags and ordered arguments', (add) => {
		add.each([[5], [10], [20], [100], [250], [500]])(
			(length) => `parse ${length} tokens using StandardParser`,
			(length) => {
				const input: Token[] = [];
				let i = 0;
				while (i < length) {
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
				const parser = new StandardParser()
					.registerFlags([{ id: 'flag', prefixes: ['--flag', '--flag-alias'] }])
					.registerOptions([{ id: 'option', prefixes: ['--option', '--option-alias'] }])
					.setInput(input);

				return () => void parser.parse();
			},
		);

		add.each([[5], [10], [20], [100], [250], [500]])(
			(length) => `parse ${length} tokens using VariadicFlagParser`,
			(length) => {
				const input: Token[] = [];
				let i = 0;
				while (i < length) {
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
				const parser = new VariadicFlagParser()
					.registerFlags([{ id: 'flag', prefixes: ['--flag', '--flag-alias'] }])
					.registerOptions([{ id: 'option', prefixes: ['--option', '--option-alias'] }])
					.setInput(input);

				return () => void parser.parse();
			},
		);
	});
});
