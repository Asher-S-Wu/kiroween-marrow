import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionById, listPublicSessions } from '@/skeleton/storage/session-repo';
import { CourtWorkbench } from '@/apps/postmortem-court/court-workbench';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getSessionById(id).catch(() => null);
  return {
    title: session ? `${session.title} — Postmortem Court` : 'Postmortem Court — Marrow',
  };
}

export default async function CourtDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionById(id);

  if (!session || session.appId !== 'postmortem-court') {
    notFound();
  }

  const recentSessions = await listPublicSessions({ appId: 'postmortem-court', limit: 8 });
  return <CourtWorkbench initialSession={session} recentSessions={recentSessions} />;
}
