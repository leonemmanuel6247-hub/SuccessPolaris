
import React, { useState, useRef, useEffect } from 'react';
import { Document, Category, ChatMessage } from '../types.ts';
import { aiService, AIProviderResponse } from '../services/aiService.ts';

interface PolarisBrainProps {
  count: number;
  documents: Document[];
  categories: Category[];
}

const PolarisBrain: React.FC<PolarisBrainProps> = ({ count, documents, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [diagInfo, setDiagInfo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isTyping) return;

    setInputValue('');
    setDiagInfo(null);
    setActiveSource(null);
    
    setMessages(prev => [...prev, {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    setIsTyping(true);

    try {
      const response: AIProviderResponse = await aiService.processMessage([...messages, { role: 'user', text: query, timestamp: '' }], documents);
      setActiveSource(response.source);
      setMessages(prev => [...prev, {
        role: 'model',
        text: response.text,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error: any) {
      const technicalError = error.message || "UNKNOWN_SYNC_ERROR";
      setDiagInfo(`PROTOCOLE_INTERROMPU : ${technicalError}`);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Désolé, le Nexus rencontre une instabilité majeure hors de son périmètre d'origine. Veuillez vérifier la configuration de vos clés API dans le dashboard de l'hébergeur.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[7000]">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="relative group bg-slate-950/80 backdrop-blur-3xl border border-cyan-500/30 px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 hover:border-cyan-400 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-cyan-400/5 blur-xl rounded-full group-hover:bg-cyan-400/10 transition-all"></div>
          <div className={`w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center ${isTyping ? 'animate-pulse' : ''}`}>
             <i className="fas fa-brain text-cyan-400 text-sm"></i>
          </div>
          <div className="text-left">
             <p className="text-[8px] font-black uppercase text-cyan-400/60 tracking-widest">IA Polaris</p>
             <p className="text-[13px] font-black text-white">Brain v3.1</p>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full sm:bottom-6 sm:right-6 sm:w-[420px] h-[100dvh] sm:h-[650px] z-[8000] bg-slate-950/98 backdrop-blur-3xl border-t sm:border border-white/10 sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-satellite text-cyan-400 text-xs"></i>
              </div>
              <div>
                <h3 className="text-[12px] font-black text-white uppercase tracking-widest italic">Polaris Brain</h3>
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${diagInfo ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></div>
                   <span className="text-[7px] text-white/30 uppercase font-black truncate max-w-[150px]">{diagInfo || 'Liaison Stable'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white p-2">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                 <i className="fas fa-atom text-4xl text-cyan-400 animate-spin-slow"></i>
                 <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Synchro du Nexus en cours...</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-[12.5px] leading-relaxed ${
                  m.role === 'user' ? 'bg-cyan-500 text-black font-bold rounded-tr-none' : 'bg-white/5 border border-white/10 text-white rounded-tl-none shadow-xl'
                }`}>
                   {m.text}
                   {m.role === 'model' && i === messages.length - 1 && activeSource && (
                     <p className="mt-4 pt-4 border-t border-white/5 text-[7px] text-cyan-400/40 uppercase font-black italic tracking-widest">{activeSource}</p>
                   )}
                </div>
                <span className="text-[7px] text-white/20 font-black mt-2 px-4 uppercase tracking-widest">{m.timestamp}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3 animate-pulse px-4">
                 <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                 <span className="text-[8px] text-cyan-400/60 uppercase font-black tracking-widest italic">Analyse du Flux...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-cyan-500/50 transition-all shadow-inner">
               <input 
                 value={inputValue}
                 onChange={e => setInputValue(e.target.value)}
                 className="flex-1 bg-transparent px-4 py-3 text-[13px] text-white outline-none placeholder-white/10 font-medium"
                 placeholder="Interroger Polaris Brain..."
               />
               <button type="submit" disabled={!inputValue.trim() || isTyping} className="w-11 h-11 bg-cyan-500 text-black rounded-xl flex items-center justify-center shadow-neon hover:scale-105 active:scale-90 transition-all disabled:opacity-20">
                  <i className="fas fa-bolt-lightning text-xs"></i>
               </button>
            </div>
          </form>
        </div>
      )}
      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.1); border-radius: 10px; }
      `}</style>
    </>
  );
};

export default PolarisBrain;
