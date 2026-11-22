import { NextResponse } from 'next/server';
import { pingMongo } from '@/skeleton/storage/mongo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const llmConfigured = Boolean(process.env.LLM_API_KEY?.trim());
  const llmModel = process.env.LLM_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const db = await pingMongo();
    return NextResponse.json({
      status: 'ok',
      node: process.version,
      mongodb: db,
      llm: {
        serverKeyConfigured: llmConfigured,
        defaultModel: llmModel,
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
          serverKeyConfigured: llmConfigured,
          defaultModel: llmModel,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
