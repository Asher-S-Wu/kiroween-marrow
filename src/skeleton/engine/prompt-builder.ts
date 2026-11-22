import type { AgentPersona, DomainSpec } from '@/skeleton/schema/domain';
import type { DeliberationTurn, EvidenceItem } from '@/skeleton/schema/session';
import type { ChatMessage } from '@/skeleton/llm/client';

function formatEvidenceBlock(evidenceItems: EvidenceItem[]): string {
  return evidenceItems.map((item) => `[${item.id}] (${item.label})\n${item.excerpt}`).join('\n\n');
}

export function buildRound1Messages<TVerdict extends Record<string, unknown>>(params: {
  spec: DomainSpec<TVerdict>;
  persona: AgentPersona;
  title: string;
  evidenceItems: EvidenceItem[];
}): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        `You are ${params.persona.name}, serving as ${params.persona.title} in "${params.spec.name}".`,
        `Primary analytical lens: ${params.persona.lens}.`,
        params.persona.systemDirective,
        'Rules:',
        '- Cite exact evidence IDs in square brackets such as [E1], [E2] for every factual claim.',
        '- Be sharp, concrete, and non-generic. Avoid fluff or polite filler.',
        '- Match the language of the submitted case material (Chinese if Chinese, English if English).',
        '- Keep your opening statement concise: 120 to 190 words in 2 crisp paragraphs.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Case Title: ${params.title}`,
        `Evidence Docket:`,
        formatEvidenceBlock(params.evidenceItems),
        '',
        'Deliver your Round 1 opening analysis citing the exact [E#] items above.',
      ].join('\n'),
    },
  ];
}

export function buildRound2Messages<TVerdict extends Record<string, unknown>>(params: {
  spec: DomainSpec<TVerdict>;
  persona: AgentPersona;
  title: string;
  evidenceItems: EvidenceItem[];
  round1Turns: DeliberationTurn[];
  challengedTurn: DeliberationTurn;
}): ChatMessage[] {
  const transcript = params.round1Turns
    .map((t) => `### ${t.agentName} (${t.agentTitle}) [Turn ${t.id}]\n${t.content}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        `You are ${params.persona.name} (${params.persona.title}) entering Round 2 Cross-Examination in "${params.spec.name}".`,
        params.persona.systemDirective,
        `Directly interrogate and challenge ${params.challengedTurn.agentName}'s Round 1 position where it overlooks evidence, misattributes causation, or underestimates risk—or sharpen it with an overlooked mechanism.`,
        'Rules:',
        '- Address your peer by name in the opening sentence.',
        '- Cite exact evidence IDs like [E1], [E3] to back every counterclaim.',
        '- Match the language of the submitted case material.',
        '- Keep your cross-examination razor-sharp: 100 to 160 words.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Case Title: ${params.title}`,
        `Evidence Docket:`,
        formatEvidenceBlock(params.evidenceItems),
        '',
        `Round 1 Transcript:`,
        transcript,
        '',
        `Cross-examine ${params.challengedTurn.agentName} and sharpen the panel's diagnosis.`,
      ].join('\n'),
    },
  ];
}

export function buildVerdictMessages<TVerdict extends Record<string, unknown>>(params: {
  spec: DomainSpec<TVerdict>;
  title: string;
  evidenceItems: EvidenceItem[];
  turns: DeliberationTurn[];
}): ChatMessage[] {
  const transcript = params.turns
    .map((t) => `### Round ${t.round} — ${t.agentName} (${t.agentTitle})\n${t.content}`)
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        `You are the ${params.spec.judgeTitle} synthesizing the final adjudication for "${params.spec.name}".`,
        params.spec.judgeDirective,
        'You MUST output ONLY a single valid JSON object matching this exact top-level structure:',
        '{',
        '  "evidenceGraph": {',
        '    "nodes": [',
        '      { "id": "E1", "type": "evidence", "label": "Short 3-5 word label", "detail": "Concise detail", "evidenceRef": "E1" },',
        '      { "id": "N1", "type": "root_cause" | "vulnerability" | "claim" | "remediation", "label": "Short 3-5 word label", "detail": "Concise explanation", "severity": "high" | "medium" | "low", "sourceAgentId": "agent_id" }',
        '    ],',
        '    "edges": [',
        '      { "source": "E1", "target": "N1", "relation": "causes" | "supports" | "contradicts" | "cites" | "mitigates" }',
        '    ]',
        '  },',
        `  "verdict": ${params.spec.verdictJsonShapeHint}`,
        '}',
        'Graph constraints:',
        '- Include 6 to 9 nodes total: at least 2 "evidence" nodes referencing real E# IDs from the docket, at least 2 diagnosis/vulnerability/root_cause nodes, and at least 2 "remediation" nodes.',
        '- Every edge source and target MUST exist in nodes[].id.',
        '- Match the language of the submitted case material (Chinese if Chinese, English if English).',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Case Title: ${params.title}`,
        `Evidence Docket:`,
        formatEvidenceBlock(params.evidenceItems),
        '',
        `Full 2-Round Deliberation Transcript:`,
        transcript,
        '',
        'Return the final JSON object with evidenceGraph and verdict now.',
      ].join('\n'),
    },
  ];
}
