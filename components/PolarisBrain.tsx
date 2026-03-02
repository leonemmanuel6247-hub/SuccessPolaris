
import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService.ts';
import { Document } from '../types.ts';
import { THEME } from '../constants.ts';

interface PolarisBrainProps {
  onClose: () => void;
  documents: Document[];
}

const PolarisBrain: React.FC<PolarisBrainProps> = ({ onClose, documents }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<Record<string, 'idle' | 'working' | 'ready'>>({
    'GPT-3.5': 'idle',
    'LLAMA-3': 'idle',
    'QWEN-2': 'idle',
    'GEMINI-3': 'idle'
  });
  
  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, nodeStatus]);

  const askBrain = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsProcessing(true);

    // Simulation du démarrage parallèle
    setNodeStatus({
      'GPT-3.5': 'working',
      'LLAMA-3': 'working',
      'QWEN-2': 'working',
      'GEMINI-3': 'working'
    });

    try {
      // Le modèle Gemini 3 Flash est utilisé via le service pour sa rapidité
      const response = await aiService.processMessage([
        { role: 'user', text: userText, timestamp: new Date().toISOString() }
      ], documents);

      // Simulation de la victoire de Gemini
      setTimeout(() => setNodeStatus(prev => ({...prev, 'GEMINI-3': 'ready'})), 800);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: response.text }]);
        setIsProcessing(false);
        setNodeStatus({
          'GPT-3.5': 'idle',
          'LLAMA-3': 'idle',
          'QWEN-2': 'idle',
          'GEMINI-3': 'idle'
        });
      }, 1500);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "ERREUR CRITIQUE: Défaillance du Nexus Brain." }]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 bg-[#0a0a2a]/95 backdrop-blur-xl animate-in fade-in duration-500">
      {/* Background Stars Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative w-full h-full max-w-5xl bg-[#020617] border-2 border-[#0ff0fc]/30 rounded-[3rem] shadow-[0_0_80px_rgba(0,240,252,0.15)] overflow-hidden flex flex-col">
        {/* Header Brain */}
        <div className="bg-[#0a0a2a] border-b border-[#0ff0fc]/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0ff0fc]/10 rounded-2xl flex items-center justify-center border border-[#0ff0fc]/40 shadow-[0_0_15px_rgba(0,240,252,0.2)]">
              <i className="fas fa-brain text-[#0ff0fc] text-xl animate-pulse"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0ff0fc] uppercase italic tracking-tighter">Polaris Brain</h2>
              <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Éducation Supérieure • Nexus v3.0</p>
            </div>
          </div>

          {/* Node Display */}
          <div className="flex gap-2">
            {Object.entries(nodeStatus).map(([name, status]) => (
              <div key={name} className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all duration-500 ${
                status === 'working' ? 'border-[#0ff0fc] text-[#0ff0fc] animate-pulse bg-[#0ff0fc]/5' :
                status === 'ready' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                'border-white/5 text-white/20'
              }`}>
                {name}
              </div>
            ))}
          </div>

          <button onClick={onClose} className="absolute top-6 right-6 md:static w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 text-white flex items-center justify-center border border-white/10 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <i className="fas fa-microchip text-6xl text-[#0ff0fc] mb-6"></i>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Prêt à traiter vos requêtes académiques</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-5 rounded-3xl ${
                m.role === 'user' 
                ? 'bg-[#0ff0fc]/10 border border-[#0ff0fc]/30 text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none shadow-[0_4px_15px_rgba(0,0,0,0.3)]'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={endOfChatRef} />
        </div>

        {/* Signature Astarté */}
        <div className="px-10 py-2 text-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0ff0fc]/30 italic">
            Developed by <span className="text-[#0ff0fc]">Astarté Léon</span>
          </span>
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 bg-[#0a0a2a] border-t border-[#0ff0fc]/20">
          <div className="relative flex items-center gap-4">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askBrain()}
              placeholder="Posez votre question académique au Polaris Brain..."
              className="flex-1 bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-white outline-none focus:border-[#0ff0fc]/50 transition-all font-medium text-sm placeholder-white/20"
            />
            <button 
              onClick={askBrain}
              disabled={isProcessing || !input.trim()}
              className="w-16 h-16 bg-[#0ff0fc] text-black rounded-2xl flex items-center justify-center text-xl shadow-[0_0_20px_rgba(0,240,252,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              <i className={`fas ${isProcessing ? 'fa-circle-notch fa-spin' : 'fa-bolt'}`}></i>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 240, 252, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default PolarisBrain;
