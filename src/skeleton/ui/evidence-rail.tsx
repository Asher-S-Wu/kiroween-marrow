'use client';

import { useEffect, useRef } from 'react';
import type { EvidenceItem } from '@/skeleton/schema/session';

export function EvidenceRail({
  evidenceItems,
  unitLabel,
  isLight,
  activeEvidenceId,
  citedCounts,
  onSelectEvidence,
}: {
  evidenceItems: EvidenceItem[];
  unitLabel: string;
  isLight: boolean;
  activeEvidenceId: string | null;
  citedCounts: Record<string, number>;
  onSelectEvidence: (id: string | null) => void;
}) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activeEvidenceId) return;
    const el = itemRefs.current[activeEvidenceId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeEvidenceId]);

  return (
    <aside
      className="flex flex-col border-b lg:border-b-0 lg:border-r h-full"
      style={{
        backgroundColor: 'var(--arena-surface)',
        borderColor: 'var(--arena-border)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--arena-border)' }}
      >
        <h2 className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
          {unitLabel} docket
        </h2>
        <span className="font-mono text-[11px]" style={{ color: 'var(--arena-muted)' }}>
          {evidenceItems.length} blocks
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {evidenceItems.map((item) => {
          const isActive = activeEvidenceId === item.id;
          const citations = citedCounts[item.id] ?? 0;

          return (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              type="button"
              onClick={() => onSelectEvidence(isActive ? null : item.id)}
              className="w-full text-left border p-3.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: isActive
                  ? isLight
                    ? '#FDF2F2'
                    : '#1F1517'
                  : 'var(--arena-canvas)',
                borderColor: isActive
                  ? 'var(--arena-accent)'
                  : citations > 0
                    ? isLight
                      ? '#C49A9A'
                      : '#3B282B'
                    : 'var(--arena-border)',
                borderLeftWidth: isActive || citations > 0 ? '3px' : '1px',
                borderLeftColor: isActive
                  ? 'var(--arena-accent)'
                  : citations > 0
                    ? 'var(--arena-accent)'
                    : 'var(--arena-border)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="font-mono text-[11px] font-medium"
                  style={{
                    color: isActive || citations > 0 ? 'var(--arena-accent)' : 'var(--arena-accent-alt)',
                  }}
                >
                  [{item.id}] {item.label}
                </span>
                {citations > 0 && (
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5"
                    style={{
                      backgroundColor: isLight ? 'rgba(185,28,28,0.1)' : 'rgba(229,72,77,0.16)',
                      color: 'var(--arena-accent)',
                    }}
                  >
                    cited {citations}x
                  </span>
                )}
              </div>

              <p
                className={
                  isLight
                    ? 'font-serif text-[13.5px] leading-[1.65] whitespace-pre-wrap break-words'
                    : 'font-mono text-[11.5px] leading-[1.65] whitespace-pre-wrap break-words'
                }
                style={{ color: 'var(--arena-ink)' }}
              >
                {item.excerpt}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
