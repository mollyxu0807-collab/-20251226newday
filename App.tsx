import React, { useState, useEffect, useRef } from 'react';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { TreeState } from './types';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);
  
  // Audio Refs
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // SFX: Sleigh Bells
    sfxRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3');
    sfxRef.current.volume = 0.5;

    // No default BGM initialized here as requested.
    // It will be set when the user uploads a file.

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      if (sfxRef.current) {
        sfxRef.current.pause();
        sfxRef.current = null;
      }
    };
  }, []);

  const toggleState = () => {
    // 1. Play Sound Effect
    if (sfxRef.current) {
      sfxRef.current.currentTime = 0;
      sfxRef.current.play().catch((e) => console.warn('Audio play failed', e));
    }

    // 2. Start Background Music (only if user has uploaded one)
    if (bgmRef.current && bgmRef.current.paused) {
      bgmRef.current.play().catch((e) => console.warn('BGM play failed', e));
    }

    // 3. Toggle Visual State
    setTreeState((prev) => 
      prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous BGM if exists
      if (bgmRef.current) {
        bgmRef.current.pause();
        URL.revokeObjectURL(bgmRef.current.src);
      }

      const url = URL.createObjectURL(file);
      bgmRef.current = new Audio(url);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.5;
      
      // Auto-play immediately after selection
      bgmRef.current.play().catch((err) => console.warn("Auto-play blocked", err));
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#000504] overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="audio/*" 
        onChange={handleFileChange} 
      />

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience treeState={treeState} />
      </div>

      {/* UI Overlay Layer */}
      <Overlay 
        currentState={treeState} 
        onToggle={toggleState} 
        onUploadMusic={handleUploadClick}
      />
      
      {/* Texture Overlay (Grain/Scratches for film look) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-20 mix-blend-overlay"></div>
    </div>
  );
}

export default App;