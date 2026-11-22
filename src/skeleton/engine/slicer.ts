import type { EvidenceItem } from '@/skeleton/schema/session';

export function sliceEvidence(rawInput: string, strategy: 'lines' | 'paragraphs'): EvidenceItem[] {
  const normalized = rawInput.replace(/\r\n/g, '\n').trim();

  if (strategy === 'lines') {
    const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
    const items: EvidenceItem[] = [];
    const chunkSize = lines.length > 18 ? 4 : lines.length > 8 ? 3 : 2;

    for (let i = 0; i < lines.length; i += chunkSize) {
      const start = i + 1;
      const slice = lines.slice(i, i + chunkSize);
      const end = i + slice.length;
      const id = `E${items.length + 1}`;
      items.push({
        id,
        label: start === end ? `Line ${start}` : `Lines ${start}-${end}`,
        excerpt: slice.join('\n'),
      });
    }
    return items.slice(0, 12);
  }

  const rawParagraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks =
    rawParagraphs.length >= 2
      ? rawParagraphs
      : normalized
          .split(/(?<=[.!?。！？])\s+/)
          .reduce<string[]>((acc, sentence) => {
            const last = acc[acc.length - 1];
            if (!last || last.length > 220) {
              acc.push(sentence);
            } else {
              acc[acc.length - 1] = `${last} ${sentence}`;
            }
            return acc;
          }, []);

  return chunks.slice(0, 12).map((excerpt, index) => ({
    id: `E${index + 1}`,
    label: `Passage ${index + 1}`,
    excerpt,
  }));
}

export function extractCitedEvidenceIds(text: string, validIds: Set<string>): string[] {
  const matches = text.matchAll(/\[?(E\d+)\]?/g);
  const cited = new Set<string>();
  for (const match of matches) {
    const id = match[1];
    if (validIds.has(id)) {
      cited.add(id);
    }
  }
  return [...cited];
}
