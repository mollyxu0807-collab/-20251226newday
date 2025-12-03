import React from 'react';
import { TreeState } from '../types';

interface OverlayProps {
  currentState: TreeState;
  onToggle: () => void;
  onUploadMusic: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ currentState, onToggle, onUploadMusic }) => {
  const isTree = currentState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      {/* Header */}
      <header className="flex flex-col items-center mt-4">
        <h1 className="font-serif text-3xl md:text-5xl text-yellow-500 tracking-widest uppercase drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)]">
          Merry Christmas
        </h1>
        <div className="w-24 h-[1px] bg-yellow-600 mt-4 mb-2"></div>
        <p className="font-sans text-xs md:text-sm text-emerald-200 tracking-[0.2em] uppercase">
          Interactive Holiday Experience
        </p>
      </header>

      {/* Footer / Controls */}
      <footer className="flex flex-col items-center mb-8 pointer-events-auto space-y-6">
        <button
          onClick={onToggle}
          className={`
            group relative px-8 py-4 bg-transparent overflow-hidden transition-all duration-500
            border border-yellow-600/50 hover:border-yellow-400
          `}
        >
          {/* Button Background Transition */}
          <div className={`absolute inset-0 bg-emerald-900/40 transition-transform duration-500 ${isTree ? 'scale-x-100' : 'scale-x-0'} origin-left`}></div>
          
          <span className="relative font-serif text-lg text-yellow-100 tracking-wider group-hover:text-white transition-colors">
            {isTree ? 'SCATTER FRAGMENTS' : 'ASSEMBLE TREE'}
          </span>
          
          {/* Decorative Corners */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500"></span>
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-500"></span>
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-500"></span>
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500"></span>
        </button>

        {/* Upload Music Button */}
        <button 
          onClick={onUploadMusic}
          className="text-xs text-yellow-600/70 hover:text-yellow-400 tracking-[0.2em] uppercase transition-colors border-b border-transparent hover:border-yellow-400 pb-1"
        >
          Upload Background Music ♫
        </button>

        <p className="text-emerald-600/50 text-[10px] uppercase tracking-widest">
          Scroll to zoom • Drag to rotate
        </p>
      </footer>
    </div>
  );
};