```typescript
export type ASTNodeType = 'text' | 'component_open' | 'component_close' | 'placeholder';

export interface ASTNode {
  type: ASTNodeType;
  payload?: string;
  name?: string;
  attributes?: Record<string, string>;
  status?: string;
}

export class StreamTokenParser {
  private buffer: string = "";
  private inTagContext: boolean = false;

  public processChunk(chunk: string): ASTNode[] {
    this.buffer += chunk;
    const tokens: ASTNode[] = [];

    while (this.buffer.length > 0) {
      if (!this.inTagContext) {
        // Look for the start of an ORACLE custom XML tag
        const tagStart = this.buffer.indexOf("<oracle_");

        if (tagStart === -1) {
          // If no tag is starting, the entire buffer is safe text
          // (Unless it ends with '<', in which case we must hold the last char to see if a tag forms)
          if (this.buffer.endsWith("<") || this.buffer.endsWith("<o") || this.buffer.endsWith("<or")) {
              const safeLen = this.buffer.lastIndexOf("<");
              if (safeLen > 0) {
                  tokens.push({ type: "text", payload: this.buffer.slice(0, safeLen) });
                  this.buffer = this.buffer.slice(safeLen);
              }
              break; // Wait for next chunk to resolve the potential tag
          } else {
              tokens.push({ type: "text", payload: this.buffer });
              this.buffer = "";
          }
        } else {
          // Push text that occurred before the tag
          if (tagStart > 0) {
            tokens.push({ type: "text", payload: this.buffer.slice(0, tagStart) });
          }
          this.buffer = this.buffer.slice(tagStart);
          this.inTagContext = true;
        }
      } else {
        // We are currently buffering a tag. Wait until we find the closing bracket '>'.
        const tagEnd = this.buffer.indexOf(">");

        if (tagEnd === -1) {
          // Tag is incomplete. Emit a placeholder to show a skeleton loader in the UI.
          tokens.push({ type: "placeholder", status: "compiling" });
          break; 
        } else {
          // Tag is complete. Parse attributes.
          const rawTag = this.buffer.slice(0, tagEnd + 1);
          this.buffer = this.buffer.slice(tagEnd + 1);
          this.inTagContext = false;

          if (rawTag.startsWith("</")) {
            const nameMatch = rawTag.match(/<\/oracle_([a-z_]+)>/);
            tokens.push({ 
                type: "component_close", 
                name: nameMatch ? `oracle_${nameMatch[1]}` : "unknown" 
            });
          } else {
            const parsed = this.parseXmlAttributes(rawTag);
            tokens.push(parsed);
          }
        }
      }
    }

    return tokens;
  }

  private parseXmlAttributes(rawTag: string): ASTNode {
    const tagMatch = rawTag.match(/<oracle_([a-z_]+)(?:\s+([^>]+))?>/);
    if (!tagMatch) return { type: "text", payload: rawTag };
    
    const [, component, rawAttrs] = tagMatch;
    const attributes: Record<string, string> = {};

    if (rawAttrs) {
      // Regex safely handles spaces inside quotes
      const attrRegex = /(\w+)="([^"]+)"/g;
      let match;
      while ((match = attrRegex.exec(rawAttrs)) !== null) {
        attributes[match[1]] = match[2];
      }
    }

    return { type: "component_open", name: `oracle_${component}`, attributes };
  }
}

```
