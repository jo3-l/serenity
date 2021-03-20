export interface TextPreprocessorOutput {
	characters: number[];
	wordBoundaryStartIndices: number[];
	wordBoundaryEndIndices: number[];
	originalIndices: number[];
}

export function emptyOutput(): TextPreprocessorOutput {
	return { characters: [], wordBoundaryStartIndices: [], wordBoundaryEndIndices: [], originalIndices: [] };
}

export const enum SpecialCharacters {
	WhiteSpace = -2,
	Symbol = -1,
}
