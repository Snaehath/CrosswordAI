
import React from 'react';
import { ProcessedWordEntry, WordDirection } from '../types';

interface ClueListProps {
  words: ProcessedWordEntry[];
  activeWordId: number | null;
  activeDirection: WordDirection | null;
  onClueClick: (wordId: number, direction: WordDirection) => void;
}

const ClueList: React.FC<ClueListProps> = ({ words, activeWordId, activeDirection, onClueClick }) => {
  const acrossClues = words.filter(w => w.direction === 'ACROSS').sort((a,b) => a.displayNumber - b.displayNumber);
  const downClues = words.filter(w => w.direction === 'DOWN').sort((a,b) => a.displayNumber - b.displayNumber);

  const renderClues = (clueArray: ProcessedWordEntry[], direction: WordDirection) => (
    <div className="space-y-1">
      {clueArray.map(word => {
        const isActive = word.id === activeWordId && direction === activeDirection;
        return (
          <div
            key={`${word.id}-${direction}`}
            onClick={() => onClueClick(word.id, direction)}
            className={`p-2 rounded-md cursor-pointer transition-all duration-150 ease-in-out
                        ${isActive ? 'bg-sky-700 text-sky-100 shadow-md' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            role="listitem"
            aria-current={isActive ? "true" : "false"}
          >
            <span className="font-semibold">{word.displayNumber}.</span> {word.clue} ({word.word.length})
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      <div>
        <h3 className="text-xl font-bold mb-3 text-sky-400">Across</h3>
        {acrossClues.length > 0 ? renderClues(acrossClues, 'ACROSS') : <p className="text-slate-500">No across clues.</p>}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-3 text-sky-400">Down</h3>
        {downClues.length > 0 ? renderClues(downClues, 'DOWN') : <p className="text-slate-500">No down clues.</p>}
      </div>
    </div>
  );
};

export default ClueList;
