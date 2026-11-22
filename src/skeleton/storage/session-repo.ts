import type {
  AppId,
  DeliberationTurn,
  EvidenceGraph,
  EvidenceItem,
  SessionRecord,
} from '@/skeleton/schema/session';
import { getSessionsCollection } from '@/skeleton/storage/mongo';

export async function createSessionRecord(input: {
  id: string;
  appId: AppId;
  title: string;
  rawInput: string;
  evidenceItems: EvidenceItem[];
  mode: 'ensemble' | 'single';
  model: string;
  judgeModel: string;
  isPublic: boolean;
}): Promise<SessionRecord> {
  const now = new Date().toISOString();
  const record: SessionRecord = {
    _id: input.id,
    appId: input.appId,
    title: input.title,
    rawInput: input.rawInput,
    evidenceItems: input.evidenceItems,
    status: 'pending',
    turns: [],
    meta: {
      mode: input.mode,
      model: input.model,
      judgeModel: input.judgeModel,
    },
    isPublic: input.isPublic,
    createdAt: now,
    updatedAt: now,
  };

  const col = await getSessionsCollection();
  await col.insertOne(record);
  return record;
}

export async function getSessionById(id: string): Promise<SessionRecord | null> {
  const col = await getSessionsCollection();
  return col.findOne({ _id: id });
}

export async function markSessionRunning(
  id: string,
  mode: 'ensemble' | 'single',
  model: string,
  judgeModel: string,
): Promise<void> {
  const col = await getSessionsCollection();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        status: 'running',
        'meta.mode': mode,
        'meta.model': model,
        'meta.judgeModel': judgeModel,
        updatedAt: new Date().toISOString(),
      },
      $unset: { errorMessage: '' },
    },
  );
}

export async function appendSessionTurn(id: string, turn: DeliberationTurn): Promise<void> {
  const col = await getSessionsCollection();
  await col.updateOne(
    { _id: id },
    {
      $push: { turns: turn },
      $set: { updatedAt: new Date().toISOString() },
    },
  );
}

export async function completeSessionRecord(params: {
  id: string;
  evidenceGraph: EvidenceGraph;
  verdict: Record<string, unknown>;
  judgeModel: string;
  durationMs: number;
  totalTokens?: number;
}): Promise<void> {
  const col = await getSessionsCollection();
  await col.updateOne(
    { _id: params.id },
    {
      $set: {
        status: 'completed',
        evidenceGraph: params.evidenceGraph,
        verdict: params.verdict,
        'meta.judgeModel': params.judgeModel,
        'meta.durationMs': params.durationMs,
        ...(params.totalTokens !== undefined ? { 'meta.totalTokens': params.totalTokens } : {}),
        updatedAt: new Date().toISOString(),
      },
    },
  );
}

export async function failSessionRecord(id: string, errorMessage: string): Promise<void> {
  const col = await getSessionsCollection();
  await col.updateOne(
    { _id: id },
    {
      $set: {
        status: 'failed',
        errorMessage,
        updatedAt: new Date().toISOString(),
      },
    },
  );
}

export async function listPublicSessions(options?: {
  appId?: AppId;
  limit?: number;
}): Promise<SessionRecord[]> {
  const col = await getSessionsCollection();
  const filter: Record<string, unknown> = { isPublic: true, status: 'completed' };
  if (options?.appId) {
    filter.appId = options.appId;
  }

  return col
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(options?.limit ?? 12)
    .toArray();
}
