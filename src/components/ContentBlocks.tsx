import { parseInline, type Block } from '@/lib/content';

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <strong key={i} className="font-semibold text-steel-100">
            {part.strong}
          </strong>
        )
      )}
    </>
  );
}

export default function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === 'p') {
          return (
            <p key={i} className="mt-3 leading-relaxed text-steel-300">
              <Inline text={block.text} />
            </p>
          );
        }
        if (block.kind === 'ul') {
          return (
            <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5 text-steel-300">
              {block.items.map((item, j) => (
                <li key={j} className="leading-relaxed">
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={i} className="mt-3 list-decimal space-y-1.5 pl-5 text-steel-300">
            {block.items.map((item, j) => (
              <li key={j} className="leading-relaxed">
                <Inline text={item} />
              </li>
            ))}
          </ol>
        );
      })}
    </>
  );
}
