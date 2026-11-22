import {
  DEFAULT_ENSEMBLE_LINEUP,
  DEFAULT_SINGLE_MODEL,
  OPENROUTER_DEFAULT_BASE_URL,
  type DeliberationRoutingMode,
} from '@/skeleton/llm/models';

export interface LlmRoutingConfig {
  apiKey: string;
  baseUrl: string;
  mode: DeliberationRoutingMode;
  examinerModels: [string, string, string];
  judgeModel: string;
  displayLabel: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmStreamResult {
  content: string;
  totalTokens?: number;
}

function isOpenRouterUrl(baseUrl: string): boolean {
  return baseUrl.includes('openrouter.ai');
}

function buildProviderHeaders(apiKey: string, baseUrl: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (isOpenRouterUrl(baseUrl)) {
    headers['HTTP-Referer'] =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://marrow-web-production.up.railway.app';
    headers['X-Title'] = 'Marrow';
  }
  return headers;
}

export function resolveLlmRouting(headers?: Headers): LlmRoutingConfig {
  const headerKey = headers?.get('x-llm-api-key')?.trim();
  const headerMode = headers?.get('x-llm-mode')?.trim();
  const headerModel = headers?.get('x-llm-model')?.trim();

  const apiKey =
    headerKey ||
    process.env.OPENROUTER_API_KEY?.trim() ||
    process.env.LLM_API_KEY?.trim() ||
    '';

  const baseUrl = (
    process.env.OPENROUTER_BASE_URL?.trim() ||
    process.env.LLM_BASE_URL?.trim() ||
    OPENROUTER_DEFAULT_BASE_URL
  ).replace(/\/+$/, '');

  if (!apiKey) {
    throw new Error(
      'Missing OpenRouter API key. Set OPENROUTER_API_KEY in Railway environment variables or enter your own OpenRouter key in Model settings.',
    );
  }

  const mode: DeliberationRoutingMode =
    headerMode === 'single'
      ? 'single'
      : headerMode === 'ensemble'
        ? 'ensemble'
        : process.env.LLM_ROUTING_MODE?.trim() === 'single'
          ? 'single'
          : 'ensemble';

  if (mode === 'single') {
    const chosen = headerModel || process.env.LLM_MODEL?.trim() || DEFAULT_SINGLE_MODEL;
    return {
      apiKey,
      baseUrl,
      mode: 'single',
      examinerModels: [chosen, chosen, chosen],
      judgeModel: chosen,
      displayLabel: chosen,
    };
  }

  return {
    apiKey,
    baseUrl,
    mode: 'ensemble',
    examinerModels: [...DEFAULT_ENSEMBLE_LINEUP.examiners] as [string, string, string],
    judgeModel: DEFAULT_ENSEMBLE_LINEUP.judge,
    displayLabel: 'Ensemble (4 models)',
  };
}

export async function streamChatCompletion(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<LlmStreamResult> {
  const payload: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.4,
    max_tokens: params.maxTokens ?? 2400,
    stream: true,
    stream_options: { include_usage: true },
  };

  if (isOpenRouterUrl(params.baseUrl)) {
    payload.reasoning = { effort: 'low' };
  }

  const response = await fetch(`${params.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildProviderHeaders(params.apiKey, params.baseUrl),
    body: JSON.stringify(payload),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Upstream model "${params.model}" returned HTTP ${response.status}: ${errorText.slice(0, 400)}`,
    );
  }

  if (!response.body) {
    throw new Error(`Upstream model "${params.model}" returned an empty response stream.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let totalTokens: number | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const rawPayload = line.slice(5).trim();
      if (!rawPayload || rawPayload === '[DONE]') continue;

      const parsed = JSON.parse(rawPayload) as {
        choices?: Array<{ delta?: { content?: string | null } }>;
        usage?: { total_tokens?: number };
        error?: { message?: string };
      };

      if (parsed.error?.message) {
        throw new Error(`Upstream stream error (${params.model}): ${parsed.error.message}`);
      }

      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) {
        content += delta;
        params.onDelta(delta);
      }
      if (parsed.usage?.total_tokens !== undefined) {
        totalTokens = parsed.usage.total_tokens;
      }
    }
  }

  if (!content.trim()) {
    throw new Error(`Model "${params.model}" completed without emitting text content.`);
  }

  return { content: content.trim(), totalTokens };
}

export async function completeJsonObject(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<{ json: unknown; totalTokens?: number }> {
  const payload: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
    max_tokens: params.maxTokens ?? 4096,
    response_format: { type: 'json_object' },
  };

  if (isOpenRouterUrl(params.baseUrl)) {
    payload.reasoning = { effort: 'low' };
  }

  const response = await fetch(`${params.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildProviderHeaders(params.apiKey, params.baseUrl),
    body: JSON.stringify(payload),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Arbiter model "${params.model}" returned HTTP ${response.status}: ${errorText.slice(0, 400)}`,
    );
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  if (body.error?.message) {
    throw new Error(`Arbiter error (${params.model}): ${body.error.message}`);
  }

  const raw = body.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error(`Arbiter model "${params.model}" returned an empty verdict payload.`);
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return {
    json: JSON.parse(cleaned),
    totalTokens: body.usage?.total_tokens,
  };
}
