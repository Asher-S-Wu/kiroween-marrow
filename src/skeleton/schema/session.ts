import { z } from 'zod';

export const AppIdSchema = z.enum(['postmortem-court', 'defense-tribunal']);
export type AppId = z.infer<typeof AppIdSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  excerpt: z.string().min(1),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const DeliberationTurnSchema = z.object({
  id: z.string().min(1),
  round: z.union([z.literal(1), z.literal(2)]),
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  agentTitle: z.string().min(1),
  accentHex: z.string().min(1),
  model: z.string().min(1),
  stance: z.enum(['critical', 'cautious', 'constructive']),
  content: z.string(),
  citedEvidenceIds: z.array(z.string()),
  challengesTurnId: z.string().optional(),
  createdAt: z.string(),
});
export type DeliberationTurn = z.infer<typeof DeliberationTurnSchema>;

export const EvidenceGraphNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['evidence', 'claim', 'vulnerability', 'root_cause', 'remediation']),
  label: z.string().min(1),
  detail: z.string().optional(),
  severity: z.enum(['high', 'medium', 'low']).optional(),
  sourceAgentId: z.string().optional(),
  evidenceRef: z.string().optional(),
});
export type EvidenceGraphNode = z.infer<typeof EvidenceGraphNodeSchema>;

export const EvidenceGraphEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  relation: z.enum(['cites', 'contradicts', 'supports', 'causes', 'mitigates']),
});
export type EvidenceGraphEdge = z.infer<typeof EvidenceGraphEdgeSchema>;

export const EvidenceGraphSchema = z.object({
  nodes: z.array(EvidenceGraphNodeSchema).min(2),
  edges: z.array(EvidenceGraphEdgeSchema),
});
export type EvidenceGraph = z.infer<typeof EvidenceGraphSchema>;

export const SessionStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const CreateSessionRequestSchema = z.object({
  title: z.string().trim().min(3).max(140),
  rawInput: z.string().trim().min(40).max(16000),
  isPublic: z.boolean().optional().default(true),
});
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export interface SessionRecord {
  _id: string;
  appId: AppId;
  title: string;
  rawInput: string;
  evidenceItems: EvidenceItem[];
  status: SessionStatus;
  errorMessage?: string;
  turns: DeliberationTurn[];
  evidenceGraph?: EvidenceGraph;
  verdict?: Record<string, unknown>;
  meta: {
    mode: 'ensemble' | 'single';
    model: string;
    judgeModel?: string;
    durationMs?: number;
    totalTokens?: number;
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StreamEvent =
  | {
      type: 'session_started';
      sessionId: string;
      evidenceItems: EvidenceItem[];
      mode: 'ensemble' | 'single';
      model: string;
      judgeModel: string;
    }
  | { type: 'round_started'; round: 1 | 2 | 3; label: string }
  | {
      type: 'turn_started';
      turnId: string;
      round: 1 | 2;
      agentId: string;
      agentName: string;
      agentTitle: string;
      accentHex: string;
      model: string;
      stance: 'critical' | 'cautious' | 'constructive';
      challengesTurnId?: string;
    }
  | { type: 'token'; turnId: string; delta: string }
  | { type: 'turn_complete'; turn: DeliberationTurn }
  | {
      type: 'verdict_ready';
      evidenceGraph: EvidenceGraph;
      verdict: Record<string, unknown>;
      judgeModel: string;
    }
  | { type: 'session_complete'; sessionId: string; durationMs: number; totalTokens?: number }
  | { type: 'error'; message: string };
