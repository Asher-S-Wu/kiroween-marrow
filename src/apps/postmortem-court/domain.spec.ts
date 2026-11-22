import { z } from 'zod';
import type { DomainSpec } from '@/skeleton/schema/domain';
import { postmortemCourtPresets } from '@/apps/postmortem-court/presets';
import { postmortemCourtTheme } from '@/apps/postmortem-court/theme';

export const PostmortemVerdictSchema = z.object({
  severity: z.enum(['P0', 'P1', 'P2']),
  consensusScore: z.number().min(0).max(100),
  executiveSummary: z.string().min(10),
  rootCauses: z
    .array(
      z.object({
        rank: z.number().int().min(1),
        title: z.string().min(3),
        confidence: z.number().min(0).max(100),
        evidenceIds: z.array(z.string()),
        explanation: z.string().min(10),
      }),
    )
    .min(1),
  blastRadius: z.string().min(5),
  immediateMitigations: z.array(z.string().min(4)).min(1),
  longTermPrevention: z.array(z.string().min(4)).min(1),
});

export type PostmortemVerdict = z.infer<typeof PostmortemVerdictSchema>;

export const postmortemCourtSpec: DomainSpec<PostmortemVerdict> = {
  id: 'postmortem-court',
  routePath: '/court',
  apiBasePath: '/api/court',
  name: 'Postmortem Court',
  tagline: 'Forensic multi-agent incident trial with cited causal graphs.',
  description:
    'Submit outage logs, stack traces, or a suspect deploy diff. An SRE Coroner, Security Auditor, and Performance Prosecutor cross-examine every line into a verified root-cause graph and Postmortem report.',
  registerLabel: '/court · Forensic Incident Room',
  inputLabel: 'Incident Logs, Stack Trace, or Deploy Diff',
  inputPlaceholder:
    'Paste production logs, deployment git diffs, metrics excerpts, or error traces here...',
  submitActionLabel: 'Convene Postmortem Court',
  roundLabels: ['Round 1: Forensic Autopsy', 'Round 2: Cross-Examination', 'Round 3: Final Verdict'],
  evidenceUnitLabel: 'Exhibit',
  slicerStrategy: 'lines',
  personas: [
    {
      id: 'sre_coroner',
      name: 'Dr. Vane',
      title: 'SRE Coroner',
      lens: 'Causal timeline, failure propagation, connection/resource exhaustion, blast radius, and rollback paths',
      accentHex: '#E5484D',
      stanceBias: 'critical',
      systemDirective:
        'Reconstruct exact chronological causality from logs and diffs. Distinguish proximate trigger from contributing amplifiers. Never accept hand-wavy "high traffic" excuses when a resource leak or misconfiguration exists.',
    },
    {
      id: 'security_auditor',
      name: 'Counsel Mercer',
      title: 'Security & Isolation Auditor',
      lens: 'Auth boundaries, tenant isolation, cache poisoning, secret exposure, retry abuse, and compliance impact',
      accentHex: '#F59E0B',
      stanceBias: 'cautious',
      systemDirective:
        'Audit every incident for hidden security, data-integrity, or trust-boundary implications (stale locks, partial writes, PII leakage, cache key confusion, or DoS amplification).',
    },
    {
      id: 'perf_prosecutor',
      name: 'Eng. Kurosawa',
      title: 'Performance & Systems Prosecutor',
      lens: 'Lock contention, queueing theory, tail latency, retry storms, TTL jitter, and architectural resilience',
      accentHex: '#2DD4BF',
      stanceBias: 'constructive',
      systemDirective:
        'Pinpoint queueing amplification, missing backpressure, bad timeouts, or coupled healthchecks. Propose surgical code-level and architectural fixes that prevent recurrence.',
    },
  ],
  judgeTitle: 'Chief Incident Arbiter',
  judgeDirective:
    'Weigh all three examiners objectively. Rank primary vs. contributing root causes with exact evidence citations, quantify consensus (0-100), and emit concrete immediate mitigations and structural prevention items.',
  verdictSchema: PostmortemVerdictSchema,
  verdictJsonShapeHint: `{
    "severity": "P0" | "P1" | "P2",
    "consensusScore": 92,
    "executiveSummary": "2-sentence authoritative postmortem summary citing [E#]",
    "rootCauses": [
      { "rank": 1, "title": "Short root cause title", "confidence": 95, "evidenceIds": ["E1", "E2"], "explanation": "Concrete technical mechanism" }
    ],
    "blastRadius": "Who and what failed",
    "immediateMitigations": ["Concrete step to stop bleeding right now"],
    "longTermPrevention": ["Structural engineering guardrail to prevent recurrence"]
  }`,
  presets: postmortemCourtPresets,
  theme: postmortemCourtTheme,
  formatMarkdownReport: ({ title, sessionId, createdAt, evidenceItems, turns, verdict }) => {
    const causes = verdict.rootCauses
      .map(
        (rc) =>
          `${rc.rank}. **${rc.title}** (Confidence: ${rc.confidence}% · Cites: ${rc.evidenceIds.map((e) => `[${e}]`).join(', ')})\n   ${rc.explanation}`,
      )
      .join('\n\n');

    const transcript = turns
      .map(
        (t) =>
          `### Round ${t.round} — ${t.agentName} (${t.agentTitle})\n${t.content}\n\n*Cited:* ${t.citedEvidenceIds.map((e) => `\`[${e}]\``).join(' ') || 'None'}`,
      )
      .join('\n\n---\n\n');

    const exhibits = evidenceItems
      .map((e) => `- **[${e.id}] (${e.label})**:\n\`\`\`\n${e.excerpt}\n\`\`\``)
      .join('\n');

    return [
      `# Postmortem Report: ${title}`,
      '',
      `- **Case ID**: \`${sessionId}\``,
      `- **Severity**: **${verdict.severity}**`,
      `- **Panel Consensus**: ${verdict.consensusScore}%`,
      `- **Generated**: ${createdAt}`,
      '',
      '## Executive Summary',
      verdict.executiveSummary,
      '',
      '## Blast Radius',
      verdict.blastRadius,
      '',
      '## Ranked Root Causes',
      causes,
      '',
      '## Immediate Mitigations',
      verdict.immediateMitigations.map((m) => `- [ ] ${m}`).join('\n'),
      '',
      '## Long-Term Prevention',
      verdict.longTermPrevention.map((p) => `- [ ] ${p}`).join('\n'),
      '',
      '## Evidence Docket',
      exhibits,
      '',
      '## Panel Deliberation Transcript',
      transcript,
    ].join('\n');
  },
};
