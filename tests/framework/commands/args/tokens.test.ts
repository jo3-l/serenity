import { Lexer } from '#framework/commands/args/Lexer';
import { joinTokens } from '#framework/commands/args/tokens';

describe('joinTokens()', () => {
	it('should return an empty string given an empty list of tokens', () => {
		expect(joinTokens([])).toBe('');
	});

	it('should join the tokens, retaining original whitespace and values', () => {
		const originalInput = 'hello "world " wha\\t is up guys  ';

		const tokens = new Lexer()
			.setQuotes([['"', '"']])
			.setInput(originalInput)
			.lex();

		expect(joinTokens(tokens)).toBe(originalInput);
	});
});
