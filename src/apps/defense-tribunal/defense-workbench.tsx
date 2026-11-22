'use client';

import type { SessionRecord } from '@/skeleton/schema/session';
import { defenseTribunalSpec } from '@/apps/defense-tribunal/domain.spec';
import { DefenseVerdictView } from '@/apps/defense-tribunal/verdict-view';
import { TribunalWorkbench } from '@/skeleton/ui/tribunal-workbench';

export function DefenseWorkbench({
  initialSession,
  recentSessions,
  dbError,
}: {
  initialSession?: SessionRecord | null;
  recentSessions: SessionRecord[];
  dbError?: string | null;
}) {
  return (
    <TribunalWorkbench
      spec={defenseTribunalSpec}
      peerApp={{ name: 'Postmortem Court', routePath: '/court' }}
      initialSession={initialSession}
      recentSessions={recentSessions}
      dbError={dbError}
      renderVerdict={({ verdict, activeEvidenceId, onSelectEvidence }) => (
        <DefenseVerdictView
          verdict={verdict}
          activeEvidenceId={activeEvidenceId}
          onSelectEvidence={onSelectEvidence}
        />
      )}
    />
  );
}
