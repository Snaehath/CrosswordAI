
import React from 'react';
import { GridCellData } from '../types';

interface GridCellProps {
  cellData: GridCellData;
  isActive: boolean;
  isPuzzleChecked: boolean;
  row: number;
  col: number;
  onInputChange: (row: number, col: number, value: string) => void;
  onCellClick: (row: number, col: number) => void;
  onCellFocus: (row: number, col: number) => void; 
}

const GridCell: React.FC<GridCellProps> = ({
  cellData,
  isActive,
  isPuzzleChecked,
  row,
  col,
  onInputChange,
  onCellClick,
  onCellFocus,
}) => {
  if (!cellData.isWritable) {
    return <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 border border-slate-600" aria-hidden="true" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(row, col, e.target.value.toUpperCase());
  };

  const handleClick = () => {
    onCellClick(row, col);
  };

  const handleFocus = () => {
    onCellFocus(row, col);
  };
  
  let cellBgColor = 'bg-slate-800 hover:bg-slate-700';
  let textColor = 'text-sky-300';
  let ringColor = isActive ? 'ring-2 ring-sky-400' : 'ring-1 ring-slate-600';

  if (isPuzzleChecked) {
    if (cellData.isCorrect === true) {
      cellBgColor = 'bg-green-700';
      textColor = 'text-green-100';
    } else if (cellData.isCorrect === false) {
      cellBgColor = 'bg-red-700';
      textColor = 'text-red-100';
    }
  }

  return (
    <div className={`relative w-10 h-10 sm:w-12 sm:h-12 border-slate-600 ${cellBgColor} ${ringColor} transition-all duration-150 ease-in-out`}>
      {cellData.clueNumberLabel && (
        <span className="absolute top-0.5 left-0.5 text-xs text-slate-400 font-medium select-none" style={{fontSize: '0.6rem'}}>
          {cellData.clueNumberLabel}
        </span>
      )}
      <input
        ref={cellData.inputRef}
        type="text"
        maxLength={1}
        value={cellData.value}
        onChange={handleChange}
        onClick={handleClick}
        onFocus={handleFocus}
        className={`w-full h-full text-center uppercase text-xl sm:text-2xl p-0 m-0 bg-transparent focus:outline-none ${textColor} font-semibold`}
        disabled={!cellData.isWritable}
        aria-label={`Cell ${row+1}, ${col+1}${cellData.value ? `, current value ${cellData.value}` : ''}`}
      />
    </div>
  );
};

export default GridCell;
