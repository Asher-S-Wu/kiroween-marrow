'use client';

import type { SessionRecord } from '@/skeleton/schema/session';
import { postmortemCourtSpec } from '@/apps/postmortem-court/domain.spec';
import { PostmortemVerdictView } from '@/apps/postmortem-court/verdict-view';
import { TribunalWorkbench } from '@/skeleton/ui/tribunal-workbench';

export function CourtWorkbench({
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
      spec={postmortemCourtSpec}
      peerApp={{ name: 'Defense Tribunal', routePath: '/defense' }}
      initialSession={initialSession}
      recentSessions={recentSessions}
      dbError={dbError}
      renderVerdict={({ verdict, activeEvidenceId, onSelectEvidence }) => (
        <PostmortemVerdictView
          verdict={verdict}
          activeEvidenceId={activeEvidenceId}
          onSelectEvidence={onSelectEvidence}
        />
      )}
    />
  );
}
