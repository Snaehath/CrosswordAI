
export interface GridSize {
  rows: number;
  cols: number;
}

export type WordDirection = 'ACROSS' | 'DOWN';

export interface WordEntry {
  word: string;
  clue: string;
  direction: WordDirection;
  startRow: number;
  startCol: number;
}

export interface CrosswordResponse {
  theme: string;
  gridSize: GridSize;
  words: WordEntry[];
}

export interface ProcessedWordEntry extends WordEntry {
  id: number; // Index in the original words array
  displayNumber: number; // The number shown in the grid
}

export interface GridCellData {
  value: string;
  isWritable: boolean;
  clueNumberLabel: number | null;
  originalChar: string;
  isCorrect: boolean | null;
  wordRefs: {
    ACROSS?: number; // id of ProcessedWordEntry
    DOWN?: number;   // id of ProcessedWordEntry
  };
  inputRef?: React.RefObject<HTMLInputElement>; // For focusing
}
