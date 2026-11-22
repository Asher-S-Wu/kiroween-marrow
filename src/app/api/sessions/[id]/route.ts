import { NextResponse } from 'next/server';
import { getSessionById } from '@/skeleton/storage/session-repo';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await getSessionById(id);
    if (!session) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch dossier';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
