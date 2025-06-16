
import React from 'react';
import { GridCellData } from '../types';
import GridCell from './GridCell';

interface CrosswordGridProps {
  grid: GridCellData[][];
  activeCell: { row: number; col: number } | null;
  isPuzzleChecked: boolean;
  onInputChange: (row: number, col: number, value: string) => void;
  onCellClick: (row: number, col: number) => void;
  onCellFocus: (row: number, col: number) => void;
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  grid,
  activeCell,
  isPuzzleChecked,
  onInputChange,
  onCellClick,
  onCellFocus,
}) => {
  if (!grid || grid.length === 0) {
    return <div className="text-center p-4 text-slate-400">Crossword grid will appear here.</div>;
  }

  const cols = grid[0]?.length || 0;

  return (
    <div
      className="grid gap-px bg-slate-600 p-1 shadow-2xl rounded-lg overflow-auto max-w-full"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      role="grid"
      aria-rowcount={grid.length}
      aria-colcount={cols}
    >
      {grid.map((rowArray, rowIndex) =>
        rowArray.map((cellData, colIndex) => (
          <GridCell
            key={`${rowIndex}-${colIndex}`}
            cellData={cellData}
            isActive={activeCell?.row === rowIndex && activeCell?.col === colIndex}
            isPuzzleChecked={isPuzzleChecked}
            row={rowIndex}
            col={colIndex}
            onInputChange={onInputChange}
            onCellClick={onCellClick}
            onCellFocus={onCellFocus}
          />
        ))
      )}
    </div>
  );
};

export default CrosswordGrid;
