import { z } from 'zod';
import type { DomainSpec } from '@/skeleton/schema/domain';
import { defenseTribunalPresets } from '@/apps/defense-tribunal/presets';
import { defenseTribunalTheme } from '@/apps/defense-tribunal/theme';

export const DefenseVerdictSchema = z.object({
  decision: z.enum(['Accept', 'Minor Revision', 'Major Revision', 'Reject']),
  acceptanceProbability: z.number().min(0).max(100),
  editorialSummary: z.string().min(10),
  blockingFlaws: z
    .array(
      z.object({
        severity: z.enum(['fatal', 'major', 'minor']),
        title: z.string().min(3),
        evidenceIds: z.array(z.string()),
        critique: z.string().min(10),
        requiredExperiment: z.string().min(6),
      }),
    )
    .min(1),
  defensibleStrengths: z.array(z.string().min(4)).min(1),
  rebuttalChecklist: z.array(z.string().min(4)).min(1),
});

export type DefenseVerdict = z.infer<typeof DefenseVerdictSchema>;

export const defenseTribunalSpec: DomainSpec<DefenseVerdict> = {
  id: 'defense-tribunal',
  routePath: '/defense',
  apiBasePath: '/api/defense',
  name: 'Defense Tribunal',
  tagline: 'Adversarial peer-review desk with claim fragility graphs and rebuttal plans.',
  description:
    'Submit a paper abstract, methods draft, or thesis proposal. A Methodology Purist, Novelty Skeptic, and Statistical Examiner red-pen every claim and synthesize an actionable Rebuttal checklist.',
  registerLabel: '/defense · Oxford Editorial Desk',
  inputLabel: 'Paper Abstract, Methods Section, or Thesis Proposal',
  inputPlaceholder:
    'Paste your manuscript abstract, experimental methodology, key quantitative claims, and limitations here...',
  submitActionLabel: 'Convene Defense Panel',
  roundLabels: ['Round 1: Desk Review', 'Round 2: Panel Interrogation', 'Round 3: Decision Letter'],
  evidenceUnitLabel: 'Passage',
  slicerStrategy: 'paragraphs',
  personas: [
    {
      id: 'methodology_purist',
      name: 'Prof. Lindqvist',
      title: 'Methodology Purist',
      lens: 'Experimental validity, compute/baseline parity, data leakage, confounders, and protocol rigor',
      accentHex: '#B91C1C',
      stanceBias: 'critical',
      systemDirective:
        'Scrutinize experimental design ruthlessly. Catch unfair baselines, train/test leakage, missing ablations, task-order bias, and unsupported causal leaps. Cite exact passages [E#].',
    },
    {
      id: 'novelty_skeptic',
      name: 'Dr. Okafor',
      title: 'Novelty & Framing Skeptic',
      lens: 'True scientific contribution vs. incremental engineering, claim-to-evidence alignment, and real-world scope',
      accentHex: '#B45309',
      stanceBias: 'cautious',
      systemDirective:
        'Challenge overstated titles, inflated novelty claims, and mismatches between what the abstract promises and what the method actually demonstrates. Push for honest framing and concrete differentiation.',
    },
    {
      id: 'stat_examiner',
      name: 'Prof. Chen',
      title: 'Statistical & Reproducibility Examiner',
      lens: 'Sample size, multi-seed variance, p-hacking, multiple comparisons, confidence intervals, and retention/generalization',
      accentHex: '#1D4ED8',
      stanceBias: 'constructive',
      systemDirective:
        'Audit statistical tests, confidence intervals, post-hoc thresholds, sample power, and reproducibility. Specify the exact control experiment or statistical test needed to rescue the paper.',
    },
  ],
  judgeTitle: 'Area Chair & Senior Editor',
  judgeDirective:
    'Synthesize a fair but uncompromising top-venue decision letter (NeurIPS / Nature / CHI standard). Separate fatal methodological flaws from fixable revisions, estimate realistic acceptance probability (0-100), and emit an ordered Rebuttal checklist.',
  verdictSchema: DefenseVerdictSchema,
  verdictJsonShapeHint: `{
    "decision": "Accept" | "Minor Revision" | "Major Revision" | "Reject",
    "acceptanceProbability": 38,
    "editorialSummary": "2-sentence Area Chair meta-review citing [E#]",
    "blockingFlaws": [
      { "severity": "fatal" | "major" | "minor", "title": "Short flaw title", "evidenceIds": ["E1", "E2"], "critique": "Why reviewers will reject on this point", "requiredExperiment": "Exact experiment or revision to resolve it" }
    ],
    "defensibleStrengths": ["Genuine value worth preserving in the revision"],
    "rebuttalChecklist": ["Actionable item for author rebuttal or camera-ready"]
  }`,
  presets: defenseTribunalPresets,
  theme: defenseTribunalTheme,
  formatMarkdownReport: ({ title, sessionId, createdAt, evidenceItems, turns, verdict }) => {
    const flaws = verdict.blockingFlaws
      .map(
        (f, i) =>
          `${i + 1}. **[${f.severity.toUpperCase()}] ${f.title}** (Cites: ${f.evidenceIds.map((e) => `[${e}]`).join(', ')})\n   - **Critique**: ${f.critique}\n   - **Required Revision**: ${f.requiredExperiment}`,
      )
      .join('\n\n');

    const transcript = turns
      .map(
        (t) =>
          `### Round ${t.round} — ${t.agentName} (${t.agentTitle})\n${t.content}\n\n*Cited:* ${t.citedEvidenceIds.map((e) => `\`[${e}]\``).join(' ') || 'None'}`,
      )
      .join('\n\n---\n\n');

    const passages = evidenceItems
      .map((e) => `- **[${e.id}] (${e.label})**: ${e.excerpt}`)
      .join('\n\n');

    return [
      `# Editorial Decision & Rebuttal Dossier: ${title}`,
      '',
      `- **Manuscript ID**: \`${sessionId}\``,
      `- **Recommendation**: **${verdict.decision}**`,
      `- **Estimated Acceptance Odds**: ${verdict.acceptanceProbability}%`,
      `- **Reviewed**: ${createdAt}`,
      '',
      '## Area Chair Meta-Review',
      verdict.editorialSummary,
      '',
      '## Blocking Flaws & Required Revisions',
      flaws,
      '',
      '## Defensible Strengths',
      verdict.defensibleStrengths.map((s) => `- ${s}`).join('\n'),
      '',
      '## Rebuttal Action Checklist',
      verdict.rebuttalChecklist.map((r) => `- [ ] ${r}`).join('\n'),
      '',
      '## Annotated Passages',
      passages,
      '',
      '## Reviewer Interrogation Transcript',
      transcript,
    ].join('\n');
  },
};
