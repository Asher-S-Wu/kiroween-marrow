import type { Metadata } from 'next';
import { listPublicSessions } from '@/skeleton/storage/session-repo';
import { DefenseWorkbench } from '@/apps/defense-tribunal/defense-workbench';
import type { SessionRecord } from '@/skeleton/schema/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Defense Tribunal — Marrow',
  description:
    'Adversarial academic peer-review desk: Methodology Purist, Novelty Skeptic, and Statistical Examiner dissect manuscript claims into a Rebuttal checklist.',
};

export default async function DefensePage() {
  let recentSessions: SessionRecord[] = [];
  let dbError: string | null = null;
  try {
    recentSessions = await listPublicSessions({ appId: 'defense-tribunal', limit: 8 });
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Unable to reach MongoDB';
  }

  return <DefenseWorkbench recentSessions={recentSessions} dbError={dbError} />;
}
