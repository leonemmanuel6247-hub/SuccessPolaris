
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const renderFormattedText = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\n/g, '<br/>');
    
    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsgText = inputValue;
    const userMessage: ChatMessage = {
      role: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response: AIProviderResponse = await aiService.processMessage(updatedMessages, documents);
      
      if (response.text) {
        setMessages(prev => [...prev, {
          role: 'model',
          text: response.text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim(),
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Désolé, j'ai eu un petit problème technique. Peux-tu reformuler ta question ?",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[7000] flex flex-col items-end">
        <button onClick={() => setIsOpen(!isOpen)} className="group relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className={`relative bg-slate-950/80 backdrop-blur-3xl border ${isOpen ? 'border-cyan-400' : 'border-white/10'} px-5 py-3 rounded-[1.5rem] shadow-2xl flex items-center gap-4 transition-all duration-500`}>
             <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-400/30 rounded-xl flex items-center justify-center shadow-neon">
                <i className="fas fa-brain text-cyan-400 text-sm animate-pulse"></i>
             </div>
             <div className="flex flex-col items-start text-left">
                <span className="text-[8px] font-black uppercase text-cyan-400/60 tracking-widest leading-none">Polaris Brain</span>
                <span className="text-[14px] font-black text-white">Assistant Virtuel</span>
             </div>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-0 right-0 w-full sm:bottom-6 sm:right-6 sm:w-[380px] h-[100dvh] sm:h-[550px] max-h-[100dvh] sm:max-h-[85vh] z-[8000] bg-slate-950 sm:bg-slate-950/90 backdrop-blur-3xl border-t sm:border border-white/10 sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
          
          <div className="bg-slate-900/50 p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-graduation-cap text-cyan-400 text-sm"></i>
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-[12px] tracking-widest">Polaris Brain</h3>
                <p className="text-[7px] text-white/30 font-black uppercase tracking-[0.3em]">Créé par Astarté Léon</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors p-2">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                <p className="text-[11px] text-white/50 font-medium leading-relaxed">
                  Bonjour ! Je suis ton assistant **Polaris Brain**.<br/>Comment puis-je t'aider dans tes révisions aujourd'hui ?
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] p-4 rounded-[1.5rem] text-[12px] leading-relaxed shadow-lg break-words ${
                  msg.role === 'user' 
                  ? 'bg-cyan-500 text-slate-950 font-bold rounded-tr-none' 
                  : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                }`}>
                  {renderFormattedText(msg.text)}
                </div>
                <span className="text-[7px] text-white/20 font-bold mt-1 px-2">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                </div>
                <span className="text-[7px] text-white/20 uppercase font-black tracking-widest italic">Polaris réfléchit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 sm:p-6 bg-black/40 border-t border-white/5">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition-all">
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Pose ta question ici..." 
                className="flex-1 bg-transparent px-4 py-3 text-[12px] font-medium text-white outline-none"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 bg-cyan-500 text-slate-950 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95 shadow-neon"
              >
                <i className="fas fa-arrow-up text-xs"></i>
              </button>
            </div>
          </form>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 212, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 212, 255, 0.3); }
      `}</style>
    </>
  );
};

export default PolarisBrain;
