import { z } from 'zod';

export const AgentPersonaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  lens: z.string().min(1),
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  stanceBias: z.enum(['critical', 'cautious', 'constructive']),
  systemDirective: z.string().min(1),
});

export type AgentPersona = z.infer<typeof AgentPersonaSchema>;

export const PresetCaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  title: z.string().min(1),
  rawInput: z.string().min(20),
});

export type PresetCase = z.infer<typeof PresetCaseSchema>;

export interface ThemeTokens {
  mode: 'dark' | 'light';
  bgCanvas: string;
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  borderSubtle: string;
  accentPrimary: string;
  accentSecondary: string;
  accentWarn: string;
  heroImage: string;
}

export interface DomainSpec<TVerdict extends Record<string, unknown> = Record<string, unknown>> {
  id: 'postmortem-court' | 'defense-tribunal';
  routePath: string;
  apiBasePath: string;
  name: string;
  tagline: string;
  description: string;
  registerLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  submitActionLabel: string;
  roundLabels: [string, string, string];
  evidenceUnitLabel: string;
  slicerStrategy: 'lines' | 'paragraphs';
  personas: [AgentPersona, AgentPersona, AgentPersona];
  judgeTitle: string;
  judgeDirective: string;
  verdictSchema: z.ZodType<TVerdict>;
  verdictJsonShapeHint: string;
  presets: PresetCase[];
  theme: ThemeTokens;
  formatMarkdownReport: (params: {
    title: string;
    sessionId: string;
    createdAt: string;
    evidenceItems: Array<{ id: string; label: string; excerpt: string }>;
    turns: Array<{
      round: 1 | 2;
      agentName: string;
      agentTitle: string;
      content: string;
      citedEvidenceIds: string[];
    }>;
    verdict: TVerdict;
  }) => string;
}
