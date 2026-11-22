export type DeliberationRoutingMode = 'ensemble' | 'single';

export interface CuratedModel {
  id: string;
  label: string;
  vendor: string;
  aaScore: string;
  priceLabel: string;
  note: string;
  isFree?: boolean;
}

export const OPENROUTER_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Curated November 2026 OpenRouter lineup ranked via Artificial Analysis v5.0.1.
 * Every model below supports streaming, response_format, and structured_outputs on OpenRouter.
 */
export const CURATED_OPENROUTER_MODELS: CuratedModel[] = [
  {
    id: 'meta/muse-ember',
    label: 'Muse Ember',
    vendor: 'Meta',
    aaScore: 'AA 36.0',
    priceLabel: '$0.10 / $0.50',
    note: 'Best intelligence-per-dollar overall (Nov 2026)',
  },
  {
    id: 'anthropic/claude-haiku-5.5',
    label: 'Claude Haiku 5.5',
    vendor: 'Anthropic',
    aaScore: 'AA 36.5',
    priceLabel: '$0.10 / $0.50',
    note: 'Sharpest engineering & logic critique in the $0.10 tier',
  },
  {
    id: 'deepseek/deepseek-v4.1-flash-1017',
    label: 'DeepSeek V4.1 Flash',
    vendor: 'DeepSeek',
    aaScore: 'AA 32.6',
    priceLabel: '$0.15 / $0.60',
    note: 'Latest open-weight reasoning Flash, bilingual EN/ZH',
  },
  {
    id: 'openai/gpt-6.1-terra',
    label: 'GPT-6.1 Terra',
    vendor: 'OpenAI',
    aaScore: 'AA 51.3',
    priceLabel: '$1.00 / $5.00',
    note: 'Frontier-grade arbiter for Round 3 verdict & causal graph',
  },
  {
    id: 'openai/gpt-6-luna',
    label: 'GPT-6 Luna',
    vendor: 'OpenAI',
    aaScore: 'AA 28.0',
    priceLabel: '$0.10 / $0.50',
    note: 'Ultra-low per-task cost and fast response latency',
  },
  {
    id: 'minimax/minimax-m3.1-flash',
    label: 'MiniMax M3.1 Flash',
    vendor: 'MiniMax',
    aaScore: 'AA 29.0',
    priceLabel: '$0.15 / $0.60',
    note: '1M-context agentic Flash model (Oct 2026)',
  },
  {
    id: 'z-ai/glm-5.3-flash',
    label: 'GLM 5.3 Flash',
    vendor: 'Z.ai',
    aaScore: 'AA 28.0',
    priceLabel: '$0.15 / $0.50',
    note: '1M-context lightweight GLM 5.3 series',
  },
  {
    id: 'tencent/hy4-flash',
    label: 'Tencent Hy4 Flash',
    vendor: 'Tencent',
    aaScore: 'Hy4 Fast',
    priceLabel: '$0.035 / $0.141',
    note: 'Lowest paid price tier on OpenRouter (Nov 2026)',
  },
  {
    id: 'inclusionai/ling-3.2-flash:free',
    label: 'Ling 3.2 Flash (Free)',
    vendor: 'inclusionAI',
    aaScore: 'Free tier',
    priceLabel: '$0 / $0',
    note: 'Zero-cost 1M-context OpenRouter free endpoint',
    isFree: true,
  },
];

export const DEFAULT_SINGLE_MODEL = 'meta/muse-ember';

export const DEFAULT_ENSEMBLE_LINEUP = {
  examiners: [
    'anthropic/claude-haiku-5.5',
    'meta/muse-ember',
    'deepseek/deepseek-v4.1-flash-1017',
  ] as [string, string, string],
  judge: 'openai/gpt-6.1-terra',
};

export function shortModelLabel(modelId: string): string {
  const found = CURATED_OPENROUTER_MODELS.find((m) => m.id === modelId);
  if (found) return found.label;
  const parts = modelId.split('/');
  return parts[parts.length - 1] || modelId;
}
