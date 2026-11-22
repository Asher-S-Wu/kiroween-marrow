import type { Metadata } from 'next';
import { listPublicSessions } from '@/skeleton/storage/session-repo';
import { CourtWorkbench } from '@/apps/postmortem-court/court-workbench';
import type { SessionRecord } from '@/skeleton/schema/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Postmortem Court — Marrow',
  description:
    'Forensic multi-agent incident trial: SRE Coroner, Security Auditor, and Performance Prosecutor cross-examine outage logs into cited causal graphs.',
};

export default async function CourtPage() {
  let recentSessions: SessionRecord[] = [];
  let dbError: string | null = null;
  try {
    recentSessions = await listPublicSessions({ appId: 'postmortem-court', limit: 8 });
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Unable to reach MongoDB';
  }

  return <CourtWorkbench recentSessions={recentSessions} dbError={dbError} />;
}
