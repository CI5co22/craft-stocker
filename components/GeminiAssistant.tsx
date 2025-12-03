
import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from './InventoryContext';
import { createGeminiChat, sendMessageToGemini } from '../services/geminiService';
import { Chat } from '@google/genai';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

export const GeminiAssistant: React.FC = () => {
  const { materials } = useInventory();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "¡Hola! Soy <b>Stocky</b>. ¿En qué proyecto creativo estás trabajando hoy? Puedo verificar tu inventario por ti.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    try {
      if (!chatRef.current) {
        chatRef.current = createGeminiChat(materials);
      }
    } catch (error) {
      console.error("Failed to init chat", error);
    }
  }, []); // Only on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatRef.current) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(chatRef.current, userMsg.text, materials);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText || "No pude verificar eso. Por favor, inténtalo de nuevo.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Lo siento, tengo problemas para conectar con mi cerebro digital.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-800 flex flex-col md:flex-row h-[500px] md:h-[400px]">
      
      {/* Sidebar / Header Area */}
      <div className="bg-indigo-600 p-6 md:w-1/3 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Sparkles className="text-white" size={24} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Stocky AI</h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed opacity-90">
            Tu asistente personal de inventario. Pregunta por materiales o pide ideas para proyectos.
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-50 flex flex-col min-h-0">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600' 
                  : 'bg-emerald-500'
              }`}>
                {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
              </div>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <Loader2 className="animate-spin text-emerald-600" size={16} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1 bg-slate-50 text-slate-800 placeholder-slate-400 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-200 text-sm transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
