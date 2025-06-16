
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CrosswordResponse, GridCellData, ProcessedWordEntry, WordDirection } from './types';
import { fetchCrosswordData } from './services/geminiService';
import CrosswordGrid from './components/CrosswordGrid';
import ClueList from './components/ClueList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';

const App: React.FC = () => {
  const [crosswordData, setCrosswordData] = useState<CrosswordResponse | null>(null);
  const [uiGrid, setUiGrid] = useState<GridCellData[][]>([]);
  const [processedWords, setProcessedWords] = useState<ProcessedWordEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [currentDirection, setCurrentDirection] = useState<WordDirection>('ACROSS');
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [isPuzzleChecked, setIsPuzzleChecked] = useState<boolean>(false);

  const inputRefs = useRef<React.RefObject<HTMLInputElement>[][]>([]);

  const initializeGridAndWords = useCallback((data: CrosswordResponse) => {
    const { gridSize, words } = data;
    inputRefs.current = Array(gridSize.rows)
        .fill(null)
        .map(() => Array(gridSize.cols).fill(null).map(() => React.createRef<HTMLInputElement>()));

    let clueCounter = 1;
    const wordStarts = new Map<string, number>(); // Key: "row,col", Value: display number
    
    const tempProcessedWords: ProcessedWordEntry[] = words.map((word, index) => {
      const startKey = `${word.startRow},${word.startCol}`;
      let displayNumber;
      if (wordStarts.has(startKey)) {
        displayNumber = wordStarts.get(startKey)!;
      } else {
        displayNumber = clueCounter;
        wordStarts.set(startKey, clueCounter);
        clueCounter++;
      }
      return { ...word, id: index, displayNumber };
    });
    setProcessedWords(tempProcessedWords);

    const newUiGrid: GridCellData[][] = Array(gridSize.rows)
      .fill(null)
      .map((_, r) =>
        Array(gridSize.cols)
          .fill(null)
          .map((__, c) => ({
            value: '',
            isWritable: false,
            clueNumberLabel: wordStarts.get(`${r},${c}`) || null,
            originalChar: '',
            isCorrect: null,
            wordRefs: {},
            inputRef: inputRefs.current[r][c],
          }))
      );

    tempProcessedWords.forEach(word => {
      for (let i = 0; i < word.word.length; i++) {
        let r = word.startRow;
        let c = word.startCol;
        if (word.direction === 'ACROSS') c += i;
        else r += i;

        if (r < gridSize.rows && c < gridSize.cols) {
          newUiGrid[r][c].isWritable = true;
          newUiGrid[r][c].originalChar = word.word[i];
          if (word.direction === 'ACROSS') {
            newUiGrid[r][c].wordRefs.ACROSS = word.id;
          } else {
            newUiGrid[r][c].wordRefs.DOWN = word.id;
          }
        }
      }
    });
    setUiGrid(newUiGrid);
    setActiveCell(null);
    setActiveWordId(null);
    setCurrentDirection('ACROSS');
    setIsPuzzleChecked(false);
  }, []);

  useEffect(() => {
    if (crosswordData) {
      initializeGridAndWords(crosswordData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crosswordData]); // initializeGridAndWords is memoized by useCallback

  const handleGenerateCrossword = async () => {
    setIsLoading(true);
    setError(null);
    setCrosswordData(null); // Clear previous data
    setUiGrid([]); // Clear grid immediately
    setProcessedWords([]);
    try {
      const data = await fetchCrosswordData();
      setCrosswordData(data);
    } catch (err) {
      setError((err as Error).message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const focusCell = (row: number, col: number) => {
    inputRefs.current[row]?.[col]?.current?.focus();
  };

  const handleCellClick = (row: number, col: number) => {
    if (!uiGrid[row]?.[col]?.isWritable) {
      setActiveCell(null);
      setActiveWordId(null);
      return;
    }
    
    const newActiveCell = { row, col };
    setActiveCell(newActiveCell);
    focusCell(row, col);

    const cellWordRefs = uiGrid[row][col].wordRefs;
    if (activeCell?.row === row && activeCell?.col === col) { // Clicked same cell
      if (cellWordRefs.ACROSS !== undefined && cellWordRefs.DOWN !== undefined) {
        const newDirection = currentDirection === 'ACROSS' ? 'DOWN' : 'ACROSS';
        setCurrentDirection(newDirection);
        setActiveWordId(cellWordRefs[newDirection]!);
      }
    } else { // Clicked new cell
      if (currentDirection === 'ACROSS' && cellWordRefs.ACROSS !== undefined) {
        setActiveWordId(cellWordRefs.ACROSS);
      } else if (currentDirection === 'DOWN' && cellWordRefs.DOWN !== undefined) {
        setActiveWordId(cellWordRefs.DOWN);
      } else if (cellWordRefs.ACROSS !== undefined) {
        setCurrentDirection('ACROSS');
        setActiveWordId(cellWordRefs.ACROSS);
      } else if (cellWordRefs.DOWN !== undefined) {
        setCurrentDirection('DOWN');
        setActiveWordId(cellWordRefs.DOWN);
      } else {
        setActiveWordId(null); // Cell is writable but somehow not part of current/any direction logic
      }
    }
  };
  
  const handleCellFocus = (row: number, col: number) => {
    // This function can be used if we want to update activeCell merely on focus
    // For now, click primarily drives activeCell and direction, focus is for input.
    // To prevent loops or complex state updates from focus alone, keep it simple.
    // If you want focus to behave like click:
    // handleCellClick(row, col); 
    // However, this might be too aggressive, especially with programmatic focus.
    // A simpler approach is to ensure activeCell is set if a cell is focused.
    if (uiGrid[row]?.[col]?.isWritable) {
        if (!activeCell || activeCell.row !== row || activeCell.col !== col) {
           // If focus moves to a new cell not currently 'active', update minimal state
           // This helps keep the 'active' highlight in sync if user tabs
           setActiveCell({row, col});
           // Don't change direction or activeWordId aggressively on focus alone,
           // let click be the primary driver for that.
        }
    }
  };

  const handleInputChange = (row: number, col: number, value: string) => {
    if (!uiGrid[row]?.[col]?.isWritable) return;

    setUiGrid(prevGrid => {
      const newGrid = prevGrid.map(r => r.map(c => ({ ...c })));
      newGrid[row][col].value = value.substring(0, 1);
      if(isPuzzleChecked) newGrid[row][col].isCorrect = null; // Clear correctness if user edits after checking
      return newGrid;
    });
    
    if(isPuzzleChecked) setIsPuzzleChecked(false);


    if (value.length === 1 && activeCell) { // Move to next cell if a character was entered
      let nextRow = row;
      let nextCol = col;
      
      const currentWord = processedWords.find(w => w.id === activeWordId);
      if (currentWord) {
        const wordLength = currentWord.word.length;
        let currentPosInWord = -1;
        if (currentDirection === 'ACROSS') {
          currentPosInWord = col - currentWord.startCol;
        } else {
          currentPosInWord = row - currentWord.startRow;
        }

        if (currentPosInWord < wordLength -1) { // Not the last letter of the current word
          if (currentDirection === 'ACROSS') nextCol += 1;
          else nextRow += 1;

          if (uiGrid[nextRow]?.[nextCol]?.isWritable) {
            setActiveCell({ row: nextRow, col: nextCol });
            focusCell(nextRow, nextCol);
          }
        }
      }
    }
  };

  const handleCheckAnswers = () => {
    if (!crosswordData) return;
    let allCorrect = true;
    setUiGrid(prevGrid =>
      prevGrid.map((rowArr, r) =>
        rowArr.map((cell, c) => {
          if (cell.isWritable) {
            const correct = cell.value === cell.originalChar;
            if (!correct && cell.value !== '') allCorrect = false; // Only count filled incorrect cells against "allCorrect" for now
            if (cell.value === '' && cell.originalChar !== '') allCorrect = false; // Empty but should be filled
            return { ...cell, isCorrect: cell.value === '' ? null : correct };
          }
          return cell;
        })
      )
    );
    setIsPuzzleChecked(true);
    if(allCorrect) {
        // Optionally, show a success message
        alert("Congratulations! You've completed the crossword correctly!");
    }
  };

  const handleClueClick = (wordId: number, direction: WordDirection) => {
    const word = processedWords.find(w => w.id === wordId);
    if (word) {
      setActiveCell({ row: word.startRow, col: word.startCol });
      setCurrentDirection(direction);
      setActiveWordId(wordId);
      focusCell(word.startRow, word.startCol);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!activeCell) return;
    let { row, col } = activeCell;

    let newRow = row;
    let newCol = col;
    let moved = false;

    if (e.key === 'ArrowUp') {
        newRow = Math.max(0, row - 1);
        moved = true;
    } else if (e.key === 'ArrowDown') {
        newRow = Math.min(uiGrid.length - 1, row + 1);
        moved = true;
    } else if (e.key === 'ArrowLeft') {
        newCol = Math.max(0, col - 1);
        moved = true;
    } else if (e.key === 'ArrowRight') {
        newCol = Math.min(uiGrid[0].length - 1, col + 1);
        moved = true;
    } else if (e.key === 'Backspace' && uiGrid[row][col].value === '') {
        // If current cell is empty and backspace is pressed, move to previous cell
        if (currentDirection === 'ACROSS') {
            newCol = Math.max(0, col - 1);
        } else {
            newRow = Math.max(0, row - 1);
        }
        moved = true;
    } else if (e.key === 'Enter' || e.key === 'Tab') { // Tab or Enter to toggle direction or move to next word
        e.preventDefault(); // Prevent default tab behavior
        const cellWordRefs = uiGrid[row][col].wordRefs;
        if (cellWordRefs.ACROSS !== undefined && cellWordRefs.DOWN !== undefined) {
             const newDirection = currentDirection === 'ACROSS' ? 'DOWN' : 'ACROSS';
             setCurrentDirection(newDirection);
             setActiveWordId(cellWordRefs[newDirection]!);
             focusCell(row, col); // Re-focus same cell with new direction active
        }
        return; // Don't move cursor for Enter/Tab here, handled by direction change.
    }


    if (moved) {
        e.preventDefault(); // Prevent page scroll
        if (uiGrid[newRow]?.[newCol]?.isWritable) {
            setActiveCell({ row: newRow, col: newCol });
            focusCell(newRow, newCol);
            
            // Update active word based on new cell and current direction
            const newCellWordRefs = uiGrid[newRow][newCol].wordRefs;
            if (currentDirection === 'ACROSS' && newCellWordRefs.ACROSS !== undefined) {
                setActiveWordId(newCellWordRefs.ACROSS);
            } else if (currentDirection === 'DOWN' && newCellWordRefs.DOWN !== undefined) {
                setActiveWordId(newCellWordRefs.DOWN);
            } else if (newCellWordRefs.ACROSS !== undefined) { // Fallback if currentDirection invalid for new cell
                setCurrentDirection('ACROSS');
                setActiveWordId(newCellWordRefs.ACROSS);
            } else if (newCellWordRefs.DOWN !== undefined) {
                 setCurrentDirection('DOWN');
                setActiveWordId(newCellWordRefs.DOWN);
            }
        }
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 flex flex-col items-center" onKeyDown={handleKeyDown} tabIndex={-1}>
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">Gemini Crossword</h1>
        {crosswordData && <p className="text-lg text-slate-400 mt-2">Theme: {crosswordData.theme}</p>}
      </header>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={handleGenerateCrossword}
          disabled={isLoading}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'New Crossword'}
        </button>
        {crosswordData && (
          <button
            onClick={handleCheckAnswers}
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out disabled:opacity-50"
          >
            Check Answers
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} />}

      {!isLoading && !error && crosswordData && (
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 flex justify-center">
            <CrosswordGrid
              grid={uiGrid}
              activeCell={activeCell}
              isPuzzleChecked={isPuzzleChecked}
              onInputChange={handleInputChange}
              onCellClick={handleCellClick}
              onCellFocus={handleCellFocus}
            />
          </div>
          <div className="lg:col-span-1 bg-slate-800 p-4 sm:p-6 rounded-lg shadow-xl max-h-[70vh] overflow-y-auto">
            <ClueList 
              words={processedWords} 
              activeWordId={activeWordId} 
              activeDirection={currentDirection}
              onClueClick={handleClueClick} 
            />
          </div>
        </div>
      )}
       {!isLoading && !crosswordData && !error && (
        <div className="text-center text-slate-500 mt-10 text-xl">
            Click "New Crossword" to begin!
        </div>
       )}
    </div>
  );
};

export default App;
