import { NextResponse } from 'next/server';
import { pingMongo } from '@/skeleton/storage/mongo';
import {
  DEFAULT_ENSEMBLE_LINEUP,
  OPENROUTER_DEFAULT_BASE_URL,
} from '@/skeleton/llm/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  const openrouterConfigured = Boolean(
    process.env.OPENROUTER_API_KEY?.trim() || process.env.LLM_API_KEY?.trim(),
  );

  try {
    const db = await pingMongo();
    return NextResponse.json({
      status: 'ok',
      node: process.version,
      mongodb: db,
      llm: {
        provider: 'openrouter',
        baseUrl: process.env.OPENROUTER_BASE_URL?.trim() || OPENROUTER_DEFAULT_BASE_URL,
        serverKeyConfigured: openrouterConfigured,
        defaultMode: process.env.LLM_ROUTING_MODE?.trim() === 'single' ? 'single' : 'ensemble',
        ensemble: DEFAULT_ENSEMBLE_LINEUP,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MongoDB ping failed';
    return NextResponse.json(
      {
        status: 'degraded',
        node: process.version,
        mongodb: { ok: false, error: message },
        llm: {
          provider: 'openrouter',
          serverKeyConfigured: openrouterConfigured,
          ensemble: DEFAULT_ENSEMBLE_LINEUP,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
