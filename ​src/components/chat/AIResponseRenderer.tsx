```tsx
import React, { useMemo, useRef, useEffect } from 'react';
import { StreamTokenParser, ASTNode } from '@/lib/ast/streamParser';
import { 
  OracleCard, 
  OracleSource, 
  OracleWarning, 
  OracleSteps, 
  OracleMath, 
  OracleSkeleton 
} from './CustomXMLRenderers';

interface AIResponseRendererProps {
  content: string;
  isStreaming: boolean;
}

export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({ content, isStreaming }) => {
  const parserRef = useRef(new StreamTokenParser());
  
  // Re-instantiate parser if the entire content resets (new message)
  useEffect(() => {
    if (content === "") {
      parserRef.current = new StreamTokenParser();
    }
  }, [content]);

  // Process the raw text string into a structured AST on the fly
  const ast = useMemo(() => {
    // In a true live app, we'd feed only the deltas to the parser. 
    // For React re-renders with full string state, we parse the whole string cleanly.
    const tempParser = new StreamTokenParser();
    return tempParser.processChunk(content);
  }, [content]);

  const renderAST = (nodes: ASTNode[]) => {
    const rendered: React.ReactNode[] = [];
    let i = 0;

    while (i < nodes.length) {
      const node = nodes[i];

      if (node.type === 'text') {
        // Fallback to simple paragraph rendering (In Prod: Use react-markdown here for bold/italics)
        rendered.push(
          <p key={`text-${i}`} className="text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap mb-4">
            {node.payload}
          </p>
        );
        i++;
      } 
      else if (node.type === 'placeholder') {
        rendered.push(<OracleSkeleton key={`skel-${i}`} />);
        i++;
      }
      else if (node.type === 'component_open') {
        // Capture everything inside the component until the close tag
        const innerNodes: ASTNode[] = [];
        let j = i + 1;
        let closed = false;

        while (j < nodes.length) {
          if (nodes[j].type === 'component_close' && nodes[j].name === node.name) {
            closed = true;
            break;
          }
          innerNodes.push(nodes[j]);
          j++;
        }

        // If not closed and still streaming, show skeleton. If done, render what we have.
        if (!closed && isStreaming) {
           rendered.push(<OracleSkeleton key={`skel-${i}`} />);
           break; // Stop rendering further to prevent layout breaks
        }

        // Extract raw text for the children of the component
        const childrenText = innerNodes.map(n => n.payload || '').join('');

        // Map strictly to our Premium Custom XML Renderers
        switch (node.name) {
          case 'oracle_card':
            rendered.push(<OracleCard key={`comp-${i}`} title={node.attributes?.title}>{childrenText}</OracleCard>);
            break;
          case 'oracle_warning':
            rendered.push(<OracleWarning key={`comp-${i}`}>{childrenText}</OracleWarning>);
            break;
          case 'oracle_source':
            rendered.push(<OracleSource key={`comp-${i}`} url={node.attributes?.url} confidence={node.attributes?.confidence}>{childrenText}</OracleSource>);
            break;
          case 'oracle_steps':
            rendered.push(<OracleSteps key={`comp-${i}`}>{childrenText}</OracleSteps>);
            break;
          case 'oracle_math':
            rendered.push(<OracleMath key={`comp-${i}`} formula={node.attributes?.formula}>{childrenText}</OracleMath>);
            break;
          default:
            // Graceful fallback for unknown tags
            rendered.push(<div key={`comp-${i}`} className="p-4 border border-white/10 rounded">{childrenText}</div>);
        }

        i = j + 1; // Skip past the closing tag
      } else {
        i++; // Safety skip
      }
    }

    return rendered;
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {renderAST(ast)}
    </div>
  );
};

```
