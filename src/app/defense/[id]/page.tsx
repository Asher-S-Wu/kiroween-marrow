import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSessionById, listPublicSessions } from '@/skeleton/storage/session-repo';
import { DefenseWorkbench } from '@/apps/defense-tribunal/defense-workbench';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getSessionById(id).catch(() => null);
  return {
    title: session ? `${session.title} — Defense Tribunal` : 'Defense Tribunal — Marrow',
  };
}

export default async function DefenseDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionById(id);

  if (!session || session.appId !== 'defense-tribunal') {
    notFound();
  }

  const recentSessions = await listPublicSessions({ appId: 'defense-tribunal', limit: 8 });
  return <DefenseWorkbench initialSession={session} recentSessions={recentSessions} />;
}
