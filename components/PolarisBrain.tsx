
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Document, ChatMessage } from '../types.ts';

interface PolarisBrainProps {
  documents: Document[];
}

const PolarisBrain: React.FC<PolarisBrainProps> = ({ documents }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Bonjour, je suis Astarté. Comment puis-je t\'aider dans tes révisions aujourd\'hui ?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const docContext = documents.map(d => `- ${d.title} (Sujet: ${d.tags.join(', ')})`).join('\n');
      const systemPrompt = `Tu es Astarté, une IA tuteur experte pour les élèves. 
      Ton ton est encourageant, futuriste et précis. 
      Voici les documents disponibles sur le site : 
      ${docContext}
      Réponds aux questions de l'élève et suggère-lui des documents spécifiques s'ils correspondent à sa demande.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: userText }] }
        ],
      });

      const aiText = response.text || "Je n'ai pas pu formuler de réponse. Réessaie, élève.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Erreur de connexion à la Matrice. Vérifie tes protocoles." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-[7000] w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-neon ${isOpen ? 'bg-red-500 rotate-45' : 'bg-cyan-500 hover:scale-110'}`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-brain'} text-2xl text-slate-950`}></i>
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>}
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-8 z-[7000] w-[350px] md:w-[400px] h-[500px] bg-slate-900/90 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="p-6 border-b border-white/10 bg-black/40 flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                <i className="fas fa-microchip text-cyan-400"></i>
             </div>
             <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Astarté</h4>
                <p className="text-[8px] text-cyan-400/60 uppercase font-black">Interface Tuteur v2.5</p>
             </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-[10px] text-cyan-400 animate-pulse font-black uppercase">Calcul des probabilités...</div>}
          </div>

          <div className="p-4 bg-black/40 border-t border-white/10 flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Questionner Astarté..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[12px] text-white outline-none focus:border-cyan-400"
            />
            <button onClick={handleSend} className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center hover:bg-cyan-400 transition-all">
               <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PolarisBrain;
