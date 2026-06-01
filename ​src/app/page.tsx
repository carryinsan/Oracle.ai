'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Infinity as InfinityIcon, Plus, Pin, ChevronDown, PanelLeft, PanelRight, 
  Globe, Database, Paperclip, Mic, Send, Activity, Network, Folder, BarChart3, Expand
} from 'lucide-react';
import { AIResponseRenderer } from '@/components/chat/AIResponseRenderer';
import { CognitiveMode } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function OracleWorkspace() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<CognitiveMode>('oracle');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Execute the POST request to our SSE endpoint (Phase 5 & 6)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: activeChatId,
          message: userMessage.content,
          mode: activeMode
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to connect to ORACLE.');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      if (reader) {
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) buffer += decoder.decode(value, { stream: true });

          // Parse SSE Chunks
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') continue;

              try {
                const data = JSON.parse(dataStr);
                
                // Track Token Streams
                if (data.content) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId ? { ...msg, content: data.content } : msg
                  ));
                }
                
                // Track Chat ID Assignment
                if (data.chat_id && !activeChatId) {
                  setActiveChatId(data.chat_id);
                }

              } catch (e) {
                console.error("SSE Parse Error", e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `\n<oracle_warning>System Error: ${error.message}</oracle_warning>` } 
          : msg
      ));
    } finally {
      setIsGenerating(false);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
      ));
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#03060d]">
      
      {/* 1. LEFT SIDEBAR (History) */}
      <div className={`transition-all duration-300 ease-in-out flex flex-col glass-panel border-r border-white/5 relative z-20 bg-[#050812] shrink-0 ${leftOpen ? 'w-64 md:w-72 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-none'}`}>
        <div className="p-5 flex items-center justify-between border-b border-white/5 group cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <InfinityIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">ORACLE</div>
              <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Elite Workspace</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button onClick={() => { setMessages([]); setActiveChatId(null); }} className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all text-sm font-medium text-white flex items-center justify-between group">
            <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform" /> New Thread</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
          <div>
            <div className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-widest flex items-center gap-2"><Pin className="w-3 h-3" /> Pinned</div>
            <div className="px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg cursor-pointer flex items-center gap-2 truncate">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> System Architecture
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#03060d] to-[#03060d]">
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 backdrop-blur-md z-30 bg-[#03060d]/60">
          <div className="flex items-center gap-3">
            <button onClick={() => setLeftOpen(!leftOpen)} className="text-slate-400 hover:text-white transition-colors p-1"><PanelLeft className="w-5 h-5" /></button>
            <div className="h-4 w-px bg-white/10"></div>
            <select 
              value={activeMode} 
              onChange={(e) => setActiveMode(e.target.value as CognitiveMode)}
              className="bg-transparent text-sm font-bold text-purple-400 outline-none cursor-pointer"
            >
              <option value="spark">Spark (Fast)</option>
              <option value="smarter">Smarter (Balanced)</option>
              <option value="thinker">Thinker (Deep Logic)</option>
              <option value="oracle">Oracle (Synthesis)</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setRightOpen(!rightOpen)} className="text-slate-400 hover:text-white transition-colors p-1"><PanelRight className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 pt-6">
          <div className="max-w-[900px] mx-auto space-y-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <InfinityIcon className="w-16 h-16 text-white/10 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">How can I assist you?</h2>
                <p className="text-slate-400 text-sm">System initialized. Memory graph and live search are online.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-4'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-2xl bg-[#050810] flex items-center justify-center shrink-0 border border-white/10 shadow-[0_0_20px_rgba(168,85,247,0.2)] elite-border">
                      <InfinityIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className={msg.role === 'user' 
                    ? "max-w-[85%] bg-gradient-to-br from-[#111827] to-[#1e293b] text-slate-200 px-6 py-4 rounded-3xl rounded-tr-sm text-[15px] shadow-lg border border-white/10"
                    : "flex-1 min-w-0"}>
                    
                    {msg.role === 'assistant' && (
                      <div className="text-sm font-bold text-white mb-3 tracking-widest uppercase text-shadow-sm text-cyan-400">
                        {activeMode.toUpperCase()}
                      </div>
                    )}
                    
                    {/* Render Content */}
                    {msg.role === 'user' ? (
                       <p>{msg.content}</p>
                    ) : (
                       <AIResponseRenderer content={msg.content} isStreaming={msg.isStreaming || false} />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Box */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#03060d] via-[#03060d]/90 to-transparent pointer-events-none">
          <div className="max-w-[900px] mx-auto pointer-events-auto">
            <div className="glass-input rounded-2xl p-2.5 flex flex-col gap-2 elite-border shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                className="w-full bg-transparent text-slate-200 px-3 py-2 max-h-32 resize-none focus:outline-none placeholder-slate-500 text-[15px]"
                placeholder="Instruct ORACLE..."
                rows={1}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><Paperclip className="w-5 h-5" /></button>
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={isGenerating || !input.trim()}
                  className={`p-2.5 rounded-full text-white transition-all ${isGenerating ? 'bg-slate-700' : 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105'}`}>
                  {isGenerating ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
            </div>
            <div className="text-center mt-3 text-[10px] text-slate-600 font-mono">
              ORACLE Cognitive Engine • End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR (Telemetry) */}
      <div className={`transition-all duration-300 ease-in-out flex flex-col glass-panel border-l border-white/5 relative z-20 bg-[#050812] shrink-0 ${rightOpen ? 'w-72 lg:w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden border-none'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Telemetry</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Network className="w-3 h-3" /> Active Semantic Nodes</h3>
            <div className="h-40 rounded-xl bg-[#03060d] border border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 to-transparent"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#050812] border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] z-10 animate-pulse">
                  <Database className="w-5 h-5 text-cyan-400" />
               </div>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><BarChart3 className="w-3 h-3" /> Current Engine</h3>
            <div className="bg-[#03060d] p-3 rounded-xl border border-white/5 text-sm font-mono text-emerald-400 uppercase tracking-widest">
              {activeMode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
              }
