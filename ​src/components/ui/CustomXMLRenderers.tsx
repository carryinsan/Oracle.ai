```tsx
import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, Link, Sparkles, Terminal } from 'lucide-react';

export const OracleCard = ({ title, children }: { title?: string, children: React.ReactNode }) => (
  <div className="glass-card rounded-2xl p-6 relative overflow-hidden my-4 border border-white/10 shadow-lg">
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-[60px] pointer-events-none"></div>
    {title && (
      <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> {title}
      </h2>
    )}
    <div className="text-[15px] text-slate-200 leading-relaxed relative z-10">
      {children}
    </div>
  </div>
);

export const OracleWarning = ({ children }: { children: React.ReactNode }) => (
  <div className="relative overflow-hidden bg-[#1f130b] border border-amber-500/30 rounded-2xl p-6 my-4">
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px]"></div>
    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2 relative z-10">
      <AlertTriangle className="w-4 h-4" /> System Warning & Risk Factor
    </h3>
    <div className="text-[14px] text-slate-300 relative z-10 border-l-2 border-amber-500/50 pl-3">
      {children}
    </div>
  </div>
);

export const OracleSource = ({ url, confidence, children }: { url?: string, confidence?: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const domain = url ? new URL(url).hostname : 'secure-source.net';

  return (
    <div className="my-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-3 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Link className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          <span className="text-sm font-bold text-slate-200">{domain}</span>
        </div>
        {confidence && (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
            Match: {confidence}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-[#0a0f1a]/80 border-x border-b border-white/10 rounded-b-xl text-[13px] text-slate-400 -mt-2 pt-4">
          <a href={url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline mb-2 block truncate">
            {url}
          </a>
          {children}
        </div>
      )}
    </div>
  );
};

export const OracleSteps = ({ children }: { children: React.ReactNode }) => {
  const [expanded, setExpanded] = useState(false); // Thinker mode auto-expands this via props in production

  return (
    <div className="border border-white/10 rounded-2xl bg-[#050810]/80 overflow-hidden backdrop-blur-sm my-4 shadow-inner">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-purple-400" /> Diagnostic Logic Trace
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`transition-all duration-500 ease-in-out border-t border-white/5 ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 border-transparent'}`}>
        <div className="p-5 font-mono text-[12px] space-y-2 text-slate-400 leading-relaxed bg-[#030508] overflow-y-auto max-h-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export const OracleMath = ({ formula, children }: { formula?: string, children: React.ReactNode }) => (
  <div className="bg-[#050810]/80 border border-white/5 rounded-2xl p-6 my-4 overflow-x-auto shadow-inner text-center">
    {formula && <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono">Formal Calculus</div>}
    <div className="math-serif text-lg text-slate-200">
      {children}
    </div>
  </div>
);

// Compiling Skeleton Loader
export const OracleSkeleton = () => (
  <div className="animate-pulse-slow p-4 border border-white/5 bg-white/5 rounded-xl flex items-center gap-3 my-2">
    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    <div className="text-xs text-slate-400 font-mono tracking-widest uppercase">Rendering Component Matrix...</div>
  </div>
);

```
