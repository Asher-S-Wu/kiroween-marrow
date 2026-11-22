export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmStreamResult {
  content: string;
  totalTokens?: number;
}

export function resolveLlmConfig(headers?: Headers): LlmConfig {
  const headerKey = headers?.get('x-llm-api-key')?.trim();
  const headerBaseUrl = headers?.get('x-llm-base-url')?.trim();
  const headerModel = headers?.get('x-llm-model')?.trim();

  const apiKey = headerKey || process.env.LLM_API_KEY?.trim() || '';
  const baseUrl = (headerBaseUrl || process.env.LLM_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = headerModel || process.env.LLM_MODEL?.trim() || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error(
      'Missing LLM API key. Set LLM_API_KEY in server environment variables or supply your own key in Model Settings.',
    );
  }

  return { apiKey, baseUrl, model };
}

export async function streamChatCompletion(params: {
  config: LlmConfig;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<LlmStreamResult> {
  const response = await fetch(`${params.config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.config.apiKey}`,
    },
    body: JSON.stringify({
      model: params.config.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 700,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM upstream returned HTTP ${response.status}: ${errorText.slice(0, 400)}`);
  }

  if (!response.body) {
    throw new Error('LLM upstream returned an empty response stream.');
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
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      const parsed = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

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

  return { content: content.trim(), totalTokens };
}

export async function completeJsonObject(params: {
  config: LlmConfig;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<{ json: unknown; totalTokens?: number }> {
  const response = await fetch(`${params.config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.config.apiKey}`,
    },
    body: JSON.stringify({
      model: params.config.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.2,
      max_tokens: params.maxTokens ?? 1800,
      response_format: { type: 'json_object' },
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM synthesis returned HTTP ${response.status}: ${errorText.slice(0, 400)}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const raw = body.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error('LLM synthesis returned an empty verdict payload.');
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
