import React, { useState, useEffect, useRef } from 'react';
import { Send, Zap, Droplet, Hexagon, Loader2 } from 'lucide-react';
import { CONFIG } from './config';
import { Engine } from './engine';
import { ParsedMessage } from './components/AIComponents';

// Icon mapping handled cleanly in the UI layer
const getModelIcon = (modelId) => {
  switch(modelId) {
    case 'spark': return Zap;
    case 'flux': return Droplet;
    case 'oracle': return Hexagon;
    default: return Hexagon;
  }
};

export default function ChatiniApp() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System Initialized. Accessing premium model tiers. How may I assist you today?', id: 'init' }
  ]);
  const [input, setInput] = useState('');
  const [activeModel, setActiveModel] = useState('oracle');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg = { role: 'user', content: input, id: Date.now().toString() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setIsProcessing(true);

    // Limit to 10 latest messages for token efficiency
    const contextWindow = newMessages.slice(-10);

    let responseContent = '';

    try {
      if (activeModel === 'spark') {
        responseContent = await Engine.executeSpark(contextWindow);
      } else if (activeModel === 'flux') {
        responseContent = await Engine.executeFlux(contextWindow);
      } else if (activeModel === 'oracle') {
        responseContent = await Engine.executeOracle(contextWindow);
      }
    } catch (error) {
      responseContent = "An error occurred in the execution engine. Please verify API keys.";
    }

    setMessages(prev => [...prev, { role: 'assistant', content: responseContent, id: Date.now().toString(), model: activeModel }]);
    setIsProcessing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Hexagon size={18} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">Chatini</h1>
        </div>

        <div className="flex bg-black p-1 rounded-full border border-white/10 shadow-inner">
          {Object.values(CONFIG.models).map((model) => {
            const Icon = getModelIcon(model.id);
            const isActive = activeModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => setActiveModel(model.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive ? `${model.bg} ${model.color} shadow-sm` : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title={model.description}
              >
                <Icon size={14} className={isActive ? 'animate-pulse' : ''} />
                {model.name}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-48 py-8 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'user' && (
                <div className="max-w-[80%] bg-[#1a1a1a] border border-white/10 px-5 py-4 rounded-2xl rounded-tr-sm text-gray-100 shadow-md">
                  {msg.content}
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex gap-4 max-w-[90%]">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#111] border border-white/10 flex items-center justify-center mt-1">
                    {msg.id === 'init' ? <Hexagon size={16} className="text-gray-400" /> : 
                      React.createElement(getModelIcon(msg.model), { size: 16, className: CONFIG.models[msg.model].color })
                    }
                  </div>
                  <div className="flex flex-col pt-1 w-full">
                    <ParsedMessage content={msg.content} />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-4 w-full justify-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#111] border border-white/10 flex items-center justify-center mt-1">
                 {React.createElement(getModelIcon(activeModel), { size: 16, className: CONFIG.models[activeModel].color })}
              </div>
              <div className="pt-2 flex items-center gap-3 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Processing {CONFIG.models[activeModel].name} Pass... ({CONFIG.models[activeModel].maxTokens} max tokens)
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
        <div className="max-w-3xl mx-auto relative group">
          <div className={`absolute -inset-0.5 rounded-2xl blur opacity-30 transition duration-1000 group-hover:opacity-60 ${CONFIG.models[activeModel].bg}`}></div>
          <div className="relative flex items-end bg-[#0f0f0f] border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-white/30 transition-colors">
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message Chatini (${CONFIG.models[activeModel].name} Engine)...`}
              className="flex-1 max-h-48 min-h-[44px] bg-transparent text-white placeholder-gray-600 resize-none outline-none py-3 px-4 text-sm scrollbar-thin"
              rows={1}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className={`p-3 m-1 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isProcessing 
                  ? 'bg-white text-black hover:scale-105 shadow-lg' 
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={18} className={input.trim() && !isProcessing ? 'translate-x-0.5 -translate-y-0.5' : ''} />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] font-medium text-gray-600 uppercase tracking-widest">
            {CONFIG.models[activeModel].description}
          </div>
        </div>
      </footer>

    </div>
  );
}

