
import React, { useState } from 'react';
import { Document } from '../types.ts';

interface ChatWidgetProps {
  documents: Document[];
}

interface WidgetMessage {
  role: 'model' | 'user';
  text: string;
}

export default function ChatWidget({ documents }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[4000] w-16 h-16 bg-cyan-500 rounded-full shadow-2xl shadow-cyan-500/40 flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all duration-300"
      >
        <i className="fas fa-comment-dots text-2xl"></i>
      </button>

      {/* Fenêtre de Chat */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-24 md:right-6 z-[4001] w-[calc(100vw-32px)] md:w-[400px] h-[calc(100vh-100px)] md:h-[600px] max-h-[85vh] bg-[#020617] border border-cyan-500/30 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,212,255,0.2)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-cyan-500 p-4 md:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-black/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-graduation-cap text-black text-sm md:text-base"></i>
              </div>
              <div>
                <h3 className="text-black font-black text-[10px] md:text-[12px] uppercase tracking-widest">Assistant Polaris</h3>
                <p className="text-black/60 text-[8px] md:text-[9px] font-bold uppercase">Astarté Intelligence</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black hover:rotate-90 transition-transform p-2">
              <i className="fas fa-times text-lg md:text-xl"></i>
            </button>
          </div>

          {/* Iframe StackAI */}
          <div className="flex-1 bg-[#020617] relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <i className="fas fa-circle-notch fa-spin text-cyan-500 text-4xl"></i>
            </div>
            <iframe 
              src="https://www.stackai.com/chat/69bf07f4d6eabd15e91e0d64-0S0UCJiReYt23u3qA38Q79"
              className="w-full h-full border-none relative z-10"
              title="StackAI Chat"
              allow="clipboard-read; clipboard-write; microphone"
            />
          </div>
        </div>
      )}
    </>
  );
}
