/**
 * agent-notes: { ctx: "Rich React Markdown Renderer for Prompt Lab with styled headers, code blocks, lists, and inline code", deps: ["react"], state: "canonical", last: "sato@2026-08-25" }
 */
import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: { type: 'text' | 'code'; language?: string; code?: string; text?: string }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.substring(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      code: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.substring(lastIndex) });
  }

  return (
    <div className="markdown-body space-y-3 text-sm text-slate-200 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return <CodeBlock key={idx} language={part.language || 'text'} code={part.code || ''} />;
        }
        return <FormattedTextBlock key={idx} text={part.text || ''} />;
      })}
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed bg-slate-950/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedTextBlock({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Headings ###, ##, #
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={lineIdx} className="text-base font-bold text-slate-100 mt-4 mb-1 border-b border-slate-800/60 pb-1 flex items-center gap-2">
              <span className="text-indigo-400">#</span> {renderInlineFormatting(trimmed.substring(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={lineIdx} className="text-lg font-extrabold text-slate-100 mt-5 mb-2 border-b border-slate-800 pb-1 flex items-center gap-2">
              <span className="text-blue-400">##</span> {renderInlineFormatting(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={lineIdx} className="text-xl font-black text-slate-100 mt-6 mb-2 border-b border-slate-700 pb-1 flex items-center gap-2">
              <span className="text-purple-400">###</span> {renderInlineFormatting(trimmed.substring(2))}
            </h1>
          );
        }

        // Bullet lists - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineIdx} className="flex items-start gap-2.5 pl-2 py-0.5 text-slate-300">
              <span className="text-indigo-400 font-bold mt-1 text-xs">●</span>
              <div className="flex-1">{renderInlineFormatting(trimmed.substring(2))}</div>
            </div>
          );
        }

        // Numbered lists 1. 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2 py-0.5 text-slate-300">
              <span className="text-indigo-400 font-semibold text-xs mt-0.5">{numMatch[1]}.</span>
              <div className="flex-1">{renderInlineFormatting(numMatch[2])}</div>
            </div>
          );
        }

        // Blockquotes >
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={lineIdx} className="border-l-4 border-indigo-500 pl-3 py-1.5 bg-indigo-950/30 text-slate-300 rounded-r-xl italic my-2">
              {renderInlineFormatting(trimmed.substring(2))}
            </blockquote>
          );
        }

        // Normal paragraph
        return (
          <p key={lineIdx} className="text-slate-200 leading-relaxed">
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Regex to parse **bold**, *italic*, `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic text-slate-300">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs rounded-md">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
