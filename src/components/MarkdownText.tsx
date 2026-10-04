import { ReactNode } from 'react';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*|(?<![\w])_[^_\n]+_(?!\w))/g;

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, index) => {
    if (!part) return null;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 2 && ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_')))) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Dependency-free markdown renderer for AI chat responses.
 * Supports headings (#–######), bold, italic, inline code, fenced code
 * blocks, ordered/unordered lists, horizontal rules, and paragraphs.
 */
export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;
  let codeBuffer: string[] | null = null;
  let paragraph: string[] = [];

  const flushParagraph = (key: string) => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={key} className="my-1 first:mt-0 last:mb-0">
        {renderInline(paragraph.join(' '))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = (key: string) => {
    if (!listBuffer) return;
    const items = listBuffer.items.map((item, itemIndex) => (
      <li key={itemIndex} className="ml-4 list-disc">{renderInline(item)}</li>
    ));
    blocks.push(
      listBuffer.ordered ? (
        <ol key={key} className="my-1 list-decimal">{items}</ol>
      ) : (
        <ul key={key} className="my-1 list-disc">{items}</ul>
      ),
    );
    listBuffer = null;
  };

  const flushCode = (key: string) => {
    if (!codeBuffer) return;
    blocks.push(
      <pre key={key} className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 font-mono text-[11px] leading-relaxed text-neutral-100">
        <code>{codeBuffer.join('\n')}</code>
      </pre>,
    );
    codeBuffer = null;
  };

  lines.forEach((line, index) => {
    const key = `md-${index}`;
    if (codeBuffer) {
      if (/^\s*```/.test(line)) flushCode(key);
      else codeBuffer.push(line);
      return;
    }
    if (/^\s*```/.test(line)) {
      flushParagraph(`${key}-p`);
      flushList(`${key}-l`);
      codeBuffer = [];
      return;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph(`${key}-p`);
      flushList(`${key}-l`);
      const level = heading[1].length;
      blocks.push(
        <p key={key} className={`mt-3 first:mt-0 font-bold ${level <= 2 ? 'text-[13px]' : 'text-[12px]'}`}>
          {renderInline(heading[2])}
        </p>,
      );
      return;
    }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph(`${key}-p`);
      flushList(`${key}-l`);
      blocks.push(<hr key={key} className="my-3 border-neutral-200 dark:border-neutral-700" />);
      return;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet || ordered) {
      flushParagraph(`${key}-p`);
      const isOrdered = Boolean(ordered);
      if (listBuffer && listBuffer.ordered !== isOrdered) flushList(`${key}-l`);
      if (!listBuffer) listBuffer = { ordered: isOrdered, items: [] };
      listBuffer.items.push(bullet ? bullet[1] : ordered ? ordered[1] : '');
      return;
    }
    if (!line.trim()) {
      flushParagraph(`${key}-p`);
      flushList(`${key}-l`);
      return;
    }
    flushList(`${key}-l`);
    paragraph.push(line.trim());
  });

  if (codeBuffer) flushCode('md-eof-code');
  flushParagraph('md-end-p');
  flushList('md-end-l');

  return <div className={`text-[11px] leading-relaxed ${className}`}>{blocks}</div>;
}
