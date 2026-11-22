import { z } from 'zod';
import type { DomainSpec } from '@/skeleton/schema/domain';
import {
  EvidenceGraphSchema,
  type DeliberationTurn,
  type SessionRecord,
  type StreamEvent,
} from '@/skeleton/schema/session';
import { completeJsonObject, streamChatCompletion, type LlmConfig } from '@/skeleton/llm/client';
import { extractCitedEvidenceIds } from '@/skeleton/engine/slicer';
import {
  buildRound1Messages,
  buildRound2Messages,
  buildVerdictMessages,
} from '@/skeleton/engine/prompt-builder';
import {
  appendSessionTurn,
  completeSessionRecord,
  failSessionRecord,
  markSessionRunning,
} from '@/skeleton/storage/session-repo';

export async function runDeliberationStream<TVerdict extends Record<string, unknown>>(params: {
  spec: DomainSpec<TVerdict>;
  session: SessionRecord;
  llmConfig: LlmConfig;
  emit: (event: StreamEvent) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { spec, session, llmConfig, emit, signal } = params;
  const startedAt = Date.now();
  const validEvidenceIds = new Set(session.evidenceItems.map((e) => e.id));
  let totalTokens = 0;
  let hasTokenCount = false;

  try {
    await markSessionRunning(session._id, llmConfig.model);

    emit({
      type: 'session_started',
      sessionId: session._id,
      evidenceItems: session.evidenceItems,
      model: llmConfig.model,
    });

    const round1Turns: DeliberationTurn[] = [];

    // Round 1: Independent Opening Examination
    emit({ type: 'round_started', round: 1, label: spec.roundLabels[0] });
    for (let i = 0; i < spec.personas.length; i++) {
      const persona = spec.personas[i];
      const turnId = `r1_${persona.id}`;
      emit({
        type: 'turn_started',
        turnId,
        round: 1,
        agentId: persona.id,
        agentName: persona.name,
        agentTitle: persona.title,
        accentHex: persona.accentHex,
        stance: persona.stanceBias,
      });

      const messages = buildRound1Messages({
        spec,
        persona,
        title: session.title,
        evidenceItems: session.evidenceItems,
      });

      const res = await streamChatCompletion({
        config: llmConfig,
        messages,
        onDelta: (delta) => emit({ type: 'token', turnId, delta }),
        signal,
      });

      if (res.totalTokens !== undefined) {
        totalTokens += res.totalTokens;
        hasTokenCount = true;
      }

      const turn: DeliberationTurn = {
        id: turnId,
        round: 1,
        agentId: persona.id,
        agentName: persona.name,
        agentTitle: persona.title,
        accentHex: persona.accentHex,
        stance: persona.stanceBias,
        content: res.content,
        citedEvidenceIds: extractCitedEvidenceIds(res.content, validEvidenceIds),
        createdAt: new Date().toISOString(),
      };

      round1Turns.push(turn);
      await appendSessionTurn(session._id, turn);
      emit({ type: 'turn_complete', turn });
    }

    // Round 2: Cross-Examination (each agent interrogates the next peer cyclically)
    const round2Turns: DeliberationTurn[] = [];
    emit({ type: 'round_started', round: 2, label: spec.roundLabels[1] });
    for (let i = 0; i < spec.personas.length; i++) {
      const persona = spec.personas[i];
      const challengedTurn = round1Turns[(i + 1) % round1Turns.length];
      const turnId = `r2_${persona.id}`;

      emit({
        type: 'turn_started',
        turnId,
        round: 2,
        agentId: persona.id,
        agentName: persona.name,
        agentTitle: persona.title,
        accentHex: persona.accentHex,
        stance: persona.stanceBias,
        challengesTurnId: challengedTurn.id,
      });

      const messages = buildRound2Messages({
        spec,
        persona,
        title: session.title,
        evidenceItems: session.evidenceItems,
        round1Turns,
        challengedTurn,
      });

      const res = await streamChatCompletion({
        config: llmConfig,
        messages,
        onDelta: (delta) => emit({ type: 'token', turnId, delta }),
        signal,
      });

      if (res.totalTokens !== undefined) {
        totalTokens += res.totalTokens;
        hasTokenCount = true;
      }

      const turn: DeliberationTurn = {
        id: turnId,
        round: 2,
        agentId: persona.id,
        agentName: persona.name,
        agentTitle: persona.title,
        accentHex: persona.accentHex,
        stance: persona.stanceBias,
        content: res.content,
        citedEvidenceIds: extractCitedEvidenceIds(res.content, validEvidenceIds),
        challengesTurnId: challengedTurn.id,
        createdAt: new Date().toISOString(),
      };

      round2Turns.push(turn);
      await appendSessionTurn(session._id, turn);
      emit({ type: 'turn_complete', turn });
    }

    // Round 3: Structured EvidenceGraph + Domain Verdict Synthesis
    emit({ type: 'round_started', round: 3, label: spec.roundLabels[2] });
    const allTurns = [...round1Turns, ...round2Turns];
    const synthesis = await completeJsonObject({
      config: llmConfig,
      messages: buildVerdictMessages({
        spec,
        title: session.title,
        evidenceItems: session.evidenceItems,
        turns: allTurns,
      }),
      signal,
    });

    if (synthesis.totalTokens !== undefined) {
      totalTokens += synthesis.totalTokens;
      hasTokenCount = true;
    }

    const envelopeSchema = z.object({
      evidenceGraph: EvidenceGraphSchema,
      verdict: spec.verdictSchema,
    });

    const parsed = envelopeSchema.parse(synthesis.json);
    const nodeIds = new Set(parsed.evidenceGraph.nodes.map((n) => n.id));
    const cleanGraph = {
      nodes: parsed.evidenceGraph.nodes,
      edges: parsed.evidenceGraph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)),
    };

    const durationMs = Date.now() - startedAt;
    await completeSessionRecord({
      id: session._id,
      evidenceGraph: cleanGraph,
      verdict: parsed.verdict,
      durationMs,
      totalTokens: hasTokenCount ? totalTokens : undefined,
    });

    emit({ type: 'verdict_ready', evidenceGraph: cleanGraph, verdict: parsed.verdict });
    emit({
      type: 'session_complete',
      sessionId: session._id,
      durationMs,
      totalTokens: hasTokenCount ? totalTokens : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deliberation engine error';
    await failSessionRecord(session._id, message);
    emit({ type: 'error', message });
  }
}
