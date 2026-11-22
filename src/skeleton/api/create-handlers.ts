import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import type { DomainSpec } from '@/skeleton/schema/domain';
import { CreateSessionRequestSchema, type StreamEvent } from '@/skeleton/schema/session';
import { sliceEvidence } from '@/skeleton/engine/slicer';
import { resolveLlmRouting } from '@/skeleton/llm/client';
import { runDeliberationStream } from '@/skeleton/engine/orchestrator';
import {
  createSessionRecord,
  getSessionById,
  listPublicSessions,
} from '@/skeleton/storage/session-repo';

export function createDeliberationHandlers<TVerdict extends Record<string, unknown>>(
  spec: DomainSpec<TVerdict>,
) {
  async function listSessions(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const limitParam = Number(searchParams.get('limit') ?? '10');
      const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 10;
      const sessions = await listPublicSessions({ appId: spec.id, limit });
      return NextResponse.json({ appId: spec.id, sessions });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list sessions';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  async function createSession(request: Request) {
    try {
      const llmConfig = resolveLlmRouting(request.headers);
      const body = await request.json();
      const parsed = CreateSessionRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid input payload', issues: parsed.error.issues },
          { status: 400 },
        );
      }

      const evidenceItems = sliceEvidence(parsed.data.rawInput, spec.slicerStrategy);
      const prefix = spec.id === 'postmortem-court' ? 'court' : 'def';
      const sessionId = `${prefix}_${crypto.randomBytes(4).toString('hex')}`;

      const record = await createSessionRecord({
        id: sessionId,
        appId: spec.id,
        title: parsed.data.title,
        rawInput: parsed.data.rawInput,
        evidenceItems,
        mode: llmConfig.mode,
        model: llmConfig.displayLabel,
        judgeModel: llmConfig.judgeModel,
        isPublic: parsed.data.isPublic,
      });

      return NextResponse.json({ session: record }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      const status = message.includes('Missing OpenRouter API key') ? 400 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  async function streamSession(
    request: Request,
    context: { params: Promise<{ id: string }> },
  ) {
    const { id } = await context.params;
    const session = await getSessionById(id);

    if (!session || session.appId !== spec.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let llmConfig;
    try {
      llmConfig = resolveLlmRouting(request.headers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Missing OpenRouter configuration';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: StreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        if (session.status === 'completed' && session.evidenceGraph && session.verdict) {
          emit({
            type: 'session_started',
            sessionId: session._id,
            evidenceItems: session.evidenceItems,
            mode: session.meta.mode ?? 'single',
            model: session.meta.model,
            judgeModel: session.meta.judgeModel ?? session.meta.model,
          });
          for (const turn of session.turns) {
            emit({ type: 'turn_complete', turn });
          }
          emit({
            type: 'verdict_ready',
            evidenceGraph: session.evidenceGraph,
            verdict: session.verdict,
            judgeModel: session.meta.judgeModel ?? session.meta.model,
          });
          emit({
            type: 'session_complete',
            sessionId: session._id,
            durationMs: session.meta.durationMs ?? 0,
            totalTokens: session.meta.totalTokens,
          });
          controller.close();
          return;
        }

        await runDeliberationStream({
          spec,
          session,
          llmConfig,
          emit,
          signal: request.signal,
        });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  return { listSessions, createSession, streamSession };
}
