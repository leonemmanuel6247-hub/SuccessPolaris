
import React, { useState, useRef, useEffect } from 'react';
import { aiService, AIProviderResponse } from '../services/aiService.ts';
import { Document, ChatMessage as TypeChatMessage } from '../types.ts';

interface ChatWidgetProps {
  documents: Document[];
}

interface WidgetMessage {
  role: 'assistant' | 'user';
  content: string;
  source?: string;
  error?: boolean;
}

export default function ChatWidget({ documents }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant Polaris sécurisé. Environnement isolé activé." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const currentInput = input;
    const userMessage: WidgetMessage = { role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    
    setInput('');
    if (editorRef.current) {
        editorRef.current.textContent = '';
    }
    
    setIsLoading(true);
    
    try {
      const history: TypeChatMessage[] = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.content,
        timestamp: ''
      }));
      
      const response: AIProviderResponse = await aiService.processMessage(
        [...history, { role: 'user', text: currentInput, timestamp: '' }],
        documents
      );
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.text,
        source: response.source ? ` (Nexus Isolé: ${response.source})` : ''
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Désolé, le Nexus est temporairement indisponible.",
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant "Assistant Sécurisé" */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '16px 28px',
          borderRadius: '50px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 8000,
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          fontSize: '14px',
          fontWeight: '900',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className="hover:scale-105 active:scale-95"
      >
        <span style={{ fontSize: '20px' }}>🔒</span>
        Assistant Sécurisé
      </button>
      
      {/* Modal du chat isolé */}
      {isOpen && (
        <>
          {/* Overlay flou */}
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(2, 6, 23, 0.7)',
              backdropFilter: 'blur(10px)',
              zIndex: 8001
            }}
          />

          <div 
            className="animate-in slide-in-from-bottom-5 duration-300"
            style={{
              position: 'fixed',
              bottom: '95px',
              right: '24px',
              width: 'calc(100vw - 48px)',
              maxWidth: '450px',
              height: 'min(700px, 85vh)',
              background: 'white',
              borderRadius: '32px',
              boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
              zIndex: 8002,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '3px solid #10b981'
            }}
          >
            {/* En-tête Sécurisé - Thème Émeraude */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
              color: 'white',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(16,185,129,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-shield-alt text-emerald-400 text-lg"></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Polaris AI Private</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                      <span style={{ fontSize: '9px', opacity: 0.8, fontWeight: '800', textTransform: 'uppercase' }}>Environnement Isolé • Protection Active</span>
                    </div>
                  </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="hover:bg-red-500/20 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Zone de Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    padding: '14px 18px',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                    color: msg.role === 'user' ? 'white' : '#1e293b',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    boxShadow: msg.role === 'user' ? '0 8px 20px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontWeight: msg.role === 'user' ? '600' : '500',
                    border: msg.role === 'assistant' ? '1px solid #f1f5f9' : 'none'
                  }}
                >
                  {msg.content}
                  {msg.source && <div style={{ fontSize: '8px', opacity: 0.5, marginTop: '8px', textAlign: 'right', fontWeight: '900', textTransform: 'uppercase' }}>{msg.source}</div>}
                </div>
              ))}
              {isLoading && (
                <div style={{ padding: '12px 20px', background: 'white', borderRadius: '16px', alignSelf: 'flex-start', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-black uppercase">Analyse Nexus...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Éditeur ContentEditable Sécurisé */}
            <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', background: 'white' }}>
              <div style={{ position: 'relative' }}>
                <div
                  ref={editorRef}
                  contentEditable
                  id="polaris-custom-editor"
                  style={{
                    minHeight: '52px',
                    maxHeight: '160px',
                    padding: '14px 20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '20px',
                    fontSize: '14px',
                    background: '#f8fafc',
                    outline: 'none',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#1e293b',
                    fontWeight: '500',
                    transition: 'border-color 0.2s'
                  }}
                  onInput={(e) => setInput(e.currentTarget.textContent || '')}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                  spellCheck="false"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                {!input && (
                  <div style={{ position: 'absolute', top: '16px', left: '20px', color: '#94a3b8', pointerEvents: 'none', fontSize: '14px', fontWeight: '500' }}>
                    Posez votre question au Nexus...
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-lock text-[9px] text-emerald-500"></i>
                    <p style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sécurité Polaris Active</p>
                  </div>
                  <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      style={{
                          padding: '10px 20px',
                          background: input.trim() && !isLoading ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
                          color: input.trim() && !isLoading ? 'white' : '#94a3b8',
                          borderRadius: '14px',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: '900',
                          cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          transition: 'all 0.3s'
                      }}
                  >
                      Envoyer <i className="fas fa-paper-plane ml-2 text-[9px]"></i>
                  </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .chat-container::-webkit-scrollbar {
          width: 4px;
        }
        .chat-container::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        #polaris-custom-editor::-webkit-scrollbar {
          width: 4px;
        }
        #polaris-custom-editor::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
