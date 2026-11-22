'use client';

import type { DefenseVerdict } from '@/apps/defense-tribunal/domain.spec';

export function DefenseVerdictView({
  verdict,
  activeEvidenceId,
  onSelectEvidence,
}: {
  verdict: DefenseVerdict;
  activeEvidenceId: string | null;
  onSelectEvidence: (id: string | null) => void;
}) {
  const decisionColor =
    verdict.decision === 'Accept'
      ? '#15803D'
      : verdict.decision === 'Minor Revision'
        ? '#1D4ED8'
        : '#B91C1C';

  return (
    <div
      className="border p-5 space-y-5"
      style={{ backgroundColor: 'var(--arena-canvas)', borderColor: decisionColor }}
    >
      <header className="flex items-start justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--arena-border)' }}>
        <div>
          <span className="font-mono text-[11px] font-medium" style={{ color: decisionColor }}>
            Editorial recommendation
          </span>
          <h3 className="mt-1 font-serif text-xl font-semibold" style={{ color: 'var(--arena-ink)' }}>
            {verdict.decision}
          </h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold" style={{ color: decisionColor }}>
            {verdict.acceptanceProbability}%
          </div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--arena-muted)' }}>
            accept odds
          </div>
        </div>
      </header>

      <p className="font-serif text-[14.5px] leading-[1.7]" style={{ color: 'var(--arena-ink)' }}>
        {verdict.editorialSummary}
      </p>

      <div className="space-y-3">
        <h4 className="font-mono text-[11px] font-medium" style={{ color: '#B91C1C' }}>
          Blocking flaws & required revisions
        </h4>
        {verdict.blockingFlaws.map((flaw, idx) => (
          <div
            key={idx}
            className="border-l-2 pl-3.5 py-2 space-y-1.5"
            style={{
              backgroundColor: 'var(--arena-surface)',
              borderLeftColor: flaw.severity === 'fatal' ? '#B91C1C' : flaw.severity === 'major' ? '#B45309' : '#1D4ED8',
            }}
          >
            <div className="flex items-start justify-between gap-2 pr-2">
              <div className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
                {flaw.title}
              </div>
              <span className="font-mono text-[10px] shrink-0" style={{ color: '#B91C1C' }}>
                {flaw.severity}
              </span>
            </div>
            <p className="text-xs leading-relaxed pr-2" style={{ color: 'var(--arena-muted)' }}>
              {flaw.critique}
            </p>
            <p className="text-xs leading-relaxed pr-2 font-medium" style={{ color: '#1D4ED8' }}>
              Required: {flaw.requiredExperiment}
            </p>
            {flaw.evidenceIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {flaw.evidenceIds.map((eid) => {
                  const active = activeEvidenceId === eid;
                  return (
                    <button
                      key={eid}
                      type="button"
                      onClick={() => onSelectEvidence(active ? null : eid)}
                      className="font-mono text-[10.5px] px-1.5 py-0.5 border cursor-pointer"
                      style={{
                        borderColor: active ? '#B91C1C' : 'var(--arena-border)',
                        backgroundColor: active ? '#B91C1C' : 'transparent',
                        color: active ? '#FFFFFF' : '#B91C1C',
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

      <div className="grid grid-cols-1 gap-4 pt-3 border-t" style={{ borderColor: 'var(--arena-border)' }}>
        <div>
          <h4 className="font-mono text-[11px] font-medium mb-2" style={{ color: '#1D4ED8' }}>
            Rebuttal action checklist
          </h4>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--arena-ink)' }}>
            {verdict.rebuttalChecklist.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="font-mono opacity-60">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[11px] font-medium mb-2" style={{ color: 'var(--arena-muted)' }}>
            Defensible strengths
          </h4>
          <ul className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
            {verdict.defensibleStrengths.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="font-mono opacity-60">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
