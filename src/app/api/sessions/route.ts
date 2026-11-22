import { NextResponse } from 'next/server';
import { AppIdSchema } from '@/skeleton/schema/session';
import { listPublicSessions } from '@/skeleton/storage/session-repo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appParam = searchParams.get('appId');
    const limitParam = Number(searchParams.get('limit') ?? '12');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 12;

    let appId;
    if (appParam) {
      const parsed = AppIdSchema.safeParse(appParam);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid appId filter' }, { status: 400 });
      }
      appId = parsed.data;
    }

    const sessions = await listPublicSessions({ appId, limit });
    return NextResponse.json({ sessions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load public dossiers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
