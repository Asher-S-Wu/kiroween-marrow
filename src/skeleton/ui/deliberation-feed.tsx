'use client';

import type { ReactNode } from 'react';
import type { DeliberationTurn } from '@/skeleton/schema/session';

export interface StreamingTurnDraft {
  id: string;
  round: 1 | 2;
  agentId: string;
  agentName: string;
  agentTitle: string;
  accentHex: string;
  stance: 'critical' | 'cautious' | 'constructive';
  challengesTurnId?: string;
  content: string;
}

function renderContentWithCitations(
  text: string,
  validEvidenceIds: Set<string>,
  activeEvidenceId: string | null,
  onSelectEvidence: (id: string) => void,
): ReactNode[] {
  const parts = text.split(/(\[E\d+\])/g);
  return parts.map((part, idx) => {
    const match = part.match(/^\[(E\d+)\]$/);
    if (match && validEvidenceIds.has(match[1])) {
      const id = match[1];
      const active = activeEvidenceId === id;
      return (
        <button
          key={`${id}-${idx}`}
          type="button"
          onClick={() => onSelectEvidence(id)}
          className="inline-flex items-center mx-0.5 px-1.5 py-0 font-mono text-[11.5px] font-medium border transition-colors cursor-pointer align-baseline"
          style={{
            borderColor: active ? 'var(--arena-accent)' : 'var(--arena-border)',
            backgroundColor: active ? 'var(--arena-accent)' : 'var(--arena-surface)',
            color: active ? '#FFFFFF' : 'var(--arena-accent)',
          }}
        >
          [{id}]
        </button>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function DeliberationFeed({
  turns,
  streamingTurn,
  roundLabels,
  isLight,
  validEvidenceIds,
  activeEvidenceId,
  onSelectEvidence,
}: {
  turns: DeliberationTurn[];
  streamingTurn: StreamingTurnDraft | null;
  roundLabels: [string, string, string];
  isLight: boolean;
  validEvidenceIds: Set<string>;
  activeEvidenceId: string | null;
  onSelectEvidence: (id: string | null) => void;
}) {
  const turnLookup = new Map<string, DeliberationTurn>();
  for (const t of turns) {
    turnLookup.set(t.id, t);
  }

  const allItems: Array<{ kind: 'complete'; turn: DeliberationTurn } | { kind: 'streaming'; draft: StreamingTurnDraft }> =
    turns.map((turn) => ({ kind: 'complete', turn }));

  if (streamingTurn && !turns.some((t) => t.id === streamingTurn.id)) {
    allItems.push({ kind: 'streaming', draft: streamingTurn });
  }

  const round1 = allItems.filter((item) => (item.kind === 'complete' ? item.turn.round : item.draft.round) === 1);
  const round2 = allItems.filter((item) => (item.kind === 'complete' ? item.turn.round : item.draft.round) === 2);

  const renderSection = (label: string, items: typeof allItems) => {
    if (items.length === 0) return null;

    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--arena-border)' }}>
          <h3 className="font-serif text-lg font-semibold" style={{ color: 'var(--arena-ink)' }}>
            {label}
          </h3>
          <span className="font-mono text-[11px]" style={{ color: 'var(--arena-muted)' }}>
            {items.length} statements
          </span>
        </div>

        <div className="space-y-6">
          {items.map((item) => {
            const isStreaming = item.kind === 'streaming';
            const data = isStreaming ? item.draft : item.turn;
            const cited = isStreaming ? [] : item.turn.citedEvidenceIds;
            const challenged = data.challengesTurnId ? turnLookup.get(data.challengesTurnId) : undefined;

            return (
              <article
                key={data.id}
                className="pl-5 border-l-2 transition-colors"
                style={{ borderLeftColor: data.accentHex }}
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--arena-ink)' }}>
                      {data.agentName}
                    </span>
                    <span className="font-mono text-[11.5px]" style={{ color: 'var(--arena-muted)' }}>
                      {data.agentTitle}
                    </span>
                    {challenged && (
                      <span
                        className="font-mono text-[11px] px-1.5 py-0.5"
                        style={{
                          backgroundColor: isLight ? 'rgba(185,28,28,0.08)' : 'rgba(229,72,77,0.14)',
                          color: 'var(--arena-accent)',
                        }}
                      >
                        Cross-examining {challenged.agentName}
                      </span>
                    )}
                  </div>

                  {isStreaming && (
                    <span
                      className="inline-flex items-center gap-1.5 font-mono text-[11px]"
                      style={{ color: data.accentHex }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: data.accentHex }}
                      />
                      Speaking
                    </span>
                  )}
                </header>

                <div
                  className={
                    isLight
                      ? 'font-serif text-[15.5px] leading-[1.75] whitespace-pre-wrap max-w-[68ch]'
                      : 'text-[14px] leading-[1.7] whitespace-pre-wrap max-w-[68ch]'
                  }
                  style={{ color: 'var(--arena-ink)' }}
                >
                  {renderContentWithCitations(
                    data.content,
                    validEvidenceIds,
                    activeEvidenceId,
                    (id) => onSelectEvidence(activeEvidenceId === id ? null : id),
                  )}
                  {isStreaming && (
                    <span
                      className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse"
                      style={{ backgroundColor: data.accentHex }}
                    />
                  )}
                </div>

                {cited.length > 0 && (
                  <footer className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10.5px] mr-1" style={{ color: 'var(--arena-muted)' }}>
                      Cited:
                    </span>
                    {cited.map((eid) => {
                      const active = activeEvidenceId === eid;
                      return (
                        <button
                          key={eid}
                          type="button"
                          onClick={() => onSelectEvidence(active ? null : eid)}
                          className="font-mono text-[11px] px-1.5 py-0.5 border cursor-pointer transition-colors"
                          style={{
                            borderColor: active ? 'var(--arena-accent)' : 'var(--arena-border)',
                            backgroundColor: active ? 'var(--arena-accent)' : 'var(--arena-surface)',
                            color: active ? '#FFFFFF' : 'var(--arena-ink)',
                          }}
                        >
                          [{eid}]
                        </button>
                      );
                    })}
                  </footer>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  if (allItems.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
        <p className="font-serif text-xl" style={{ color: 'var(--arena-ink)' }}>
          Panel convened. Preparing opening statements.
        </p>
        <p className="mt-2 text-xs max-w-sm leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
          Each examiner inspects the sliced evidence blocks independently before interrogating their peers.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 space-y-10">
      {renderSection(roundLabels[0], round1)}
      {renderSection(roundLabels[1], round2)}
    </div>
  );
}
