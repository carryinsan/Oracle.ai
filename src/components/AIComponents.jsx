import React from 'react';
import { BarChart2, Terminal, CheckCircle2 } from 'lucide-react';

export const RichChart = ({ dataStr }) => {
  try {
    const data = JSON.parse(dataStr);
    const maxVal = Math.max(...data.map(d => d.value));
    
    return (
      <div className="w-full mt-4 p-5 bg-[#121212] border border-white/5 rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <BarChart2 size={14} className="text-cyan-400" />
          Interactive Data Analysis
        </div>
        <div className="flex items-end h-32 gap-3">
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div 
                className="w-full bg-gradient-to-t from-cyan-900/40 to-cyan-400 rounded-t-sm transition-all duration-500 ease-out group-hover:to-cyan-300 relative cursor-pointer"
                style={{ height: `${(item.value / maxVal) * 100}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded transition-opacity">
                  {item.value}
                </div>
              </div>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (e) {
    return <div className="text-red-500 text-xs">Error parsing chart data</div>;
  }
};

export const ProcessLogs = ({ logStr }) => (
  <div className="mt-4 mb-4 bg-black border border-white/10 rounded-lg p-3 font-mono text-xs text-gray-400 shadow-inner">
    <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-white/5 pb-2">
      <Terminal size={12} /> System Execution Diagnostics
    </div>
    {logStr.split('\n').map((line, i) => (
      <div key={i} className="flex items-center gap-2 py-0.5">
        <CheckCircle2 size={10} className="text-emerald-500" />
        {line}
      </div>
    ))}
  </div>
);

export const ParsedMessage = ({ content }) => {
  const combinedRegex = /<(chart|logs)>([\s\S]*?)<\/\1>/g;
  let parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.substring(lastIndex) });
  }

  return (
    <div className="space-y-2 leading-relaxed text-gray-200">
      {parts.map((part, index) => {
        if (part.type === 'chart') return <RichChart key={index} dataStr={part.content} />;
        if (part.type === 'logs') return <ProcessLogs key={index} logStr={part.content} />;
        
        return (
          <span key={index}>
            {part.content.split('**').map((text, i) => 
              i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{text}</strong> : text
            )}
          </span>
        );
      })}
    </div>
  );
};

