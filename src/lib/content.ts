import fs from 'node:fs';
import path from 'node:path';

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

export interface Section {
  heading: string;
  blocks: Block[];
}

export function parseInline(text: string): (string | { strong: string })[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? { strong: part } : part
  );
}

export function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  const pushBlock = (block: Block) => {
    if (!current) return;
    const last = current.blocks[current.blocks.length - 1];
    if (last && last.kind === block.kind) {
      if (block.kind === 'p' && last.kind === 'p') {
        last.text += ' ' + block.text;
      } else if (block.kind === 'ul' && last.kind === 'ul') {
        last.items.push(...block.items);
      } else if (block.kind === 'ol' && last.kind === 'ol') {
        last.items.push(...block.items);
      }
      return;
    }
    current.blocks.push(block);
  };

  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { heading: line.slice(3).trim(), blocks: [] };
      continue;
    }
    if (!current || line.startsWith('#')) continue;

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      pushBlock({ kind: 'ul', items: [bullet[1]] });
      continue;
    }
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      pushBlock({ kind: 'ol', items: [numbered[1]] });
      continue;
    }
    pushBlock({ kind: 'p', text: line });
  }
  if (current) sections.push(current);
  return sections;
}

export function readContentFile(name: string): string {
  const filePath = path.join(process.cwd(), 'src', 'content', name);
  return fs.readFileSync(filePath, 'utf-8');
}
