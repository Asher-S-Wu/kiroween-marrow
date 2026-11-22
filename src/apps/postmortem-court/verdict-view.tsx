'use client';

import type { PostmortemVerdict } from '@/apps/postmortem-court/domain.spec';

export function PostmortemVerdictView({
  verdict,
  activeEvidenceId,
  onSelectEvidence,
}: {
  verdict: PostmortemVerdict;
  activeEvidenceId: string | null;
  onSelectEvidence: (id: string | null) => void;
}) {
  const sevColor =
    verdict.severity === 'P0'
      ? '#E5484D'
      : verdict.severity === 'P1'
        ? '#F59E0B'
        : '#2DD4BF';

  return (
    <div className="border p-5 space-y-5" style={{ backgroundColor: 'var(--arena-surface)', borderColor: sevColor }}>
      <header className="flex items-start justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--arena-border)' }}>
        <div>
          <span className="font-mono text-[11px] font-medium" style={{ color: sevColor }}>
            Final adjudication · Severity {verdict.severity}
          </span>
          <h3 className="mt-1 font-serif text-xl font-semibold" style={{ color: 'var(--arena-ink)' }}>
            Postmortem Verdict
          </h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold" style={{ color: 'var(--arena-ink)' }}>
            {verdict.consensusScore}%
          </div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--arena-muted)' }}>
            consensus
          </div>
        </div>
      </header>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--arena-ink)' }}>
        {verdict.executiveSummary}
      </p>

      <div className="border-l-2 pl-3.5 py-0.5" style={{ borderLeftColor: 'var(--arena-warn)' }}>
        <div className="font-mono text-[11px]" style={{ color: 'var(--arena-warn)' }}>
          Blast radius
        </div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
          {verdict.blastRadius}
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-mono text-[11px] font-medium" style={{ color: 'var(--arena-muted)' }}>
          Ranked root causes
        </h4>
        {verdict.rootCauses.map((rc) => (
          <div
            key={rc.rank}
            className="border p-3.5 space-y-2"
            style={{ backgroundColor: 'var(--arena-canvas)', borderColor: 'var(--arena-border)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
                #{rc.rank} {rc.title}
              </div>
              <span className="font-mono text-[11px] shrink-0" style={{ color: sevColor }}>
                {rc.confidence}%
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
              {rc.explanation}
            </p>
            {rc.evidenceIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {rc.evidenceIds.map((eid) => {
                  const active = activeEvidenceId === eid;
                  return (
                    <button
                      key={eid}
                      type="button"
                      onClick={() => onSelectEvidence(active ? null : eid)}
                      className="font-mono text-[10.5px] px-1.5 py-0.5 border cursor-pointer"
                      style={{
                        borderColor: active ? '#E5484D' : 'var(--arena-border)',
                        backgroundColor: active ? '#E5484D' : 'transparent',
                        color: active ? '#FFFFFF' : '#E5484D',
                      }}
                    >
                      [{eid}]
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 border-t" style={{ borderColor: 'var(--arena-border)' }}>
        <div>
          <h4 className="font-mono text-[11px] font-medium mb-2" style={{ color: '#2DD4BF' }}>
            Immediate mitigations
          </h4>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--arena-ink)' }}>
            {verdict.immediateMitigations.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="font-mono opacity-60">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[11px] font-medium mb-2" style={{ color: 'var(--arena-muted)' }}>
            Structural prevention
          </h4>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
            {verdict.longTermPrevention.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="font-mono opacity-60">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
