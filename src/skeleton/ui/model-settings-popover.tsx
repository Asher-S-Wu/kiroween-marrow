'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export interface ClientLlmOverride {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const STORAGE_KEY = 'marrow_llm_override_v1';

export function loadStoredLlmOverride(): ClientLlmOverride {
  if (typeof window === 'undefined') {
    return { apiKey: '', baseUrl: '', model: '' };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { apiKey: '', baseUrl: '', model: '' };
    const parsed = JSON.parse(raw) as Partial<ClientLlmOverride>;
    return {
      apiKey: parsed.apiKey ?? '',
      baseUrl: parsed.baseUrl ?? '',
      model: parsed.model ?? '',
    };
  } catch {
    return { apiKey: '', baseUrl: '', model: '' };
  }
}

export function saveStoredLlmOverride(override: ClientLlmOverride): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(override));
}

export function buildLlmHeaders(override: ClientLlmOverride): Record<string, string> {
  const headers: Record<string, string> = {};
  if (override.apiKey.trim()) headers['x-llm-api-key'] = override.apiKey.trim();
  if (override.baseUrl.trim()) headers['x-llm-base-url'] = override.baseUrl.trim();
  if (override.model.trim()) headers['x-llm-model'] = override.model.trim();
  return headers;
}

export function ModelSettingsPopover({
  value,
  onChange,
  isLight,
}: {
  value: ClientLlmOverride;
  onChange: (next: ClientLlmOverride) => void;
  isLight: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClientLlmOverride>(value);

  const hasCustomKey = Boolean(value.apiKey.trim());

  const handleOpen = () => {
    setDraft(value);
    setOpen(true);
  };

  const handleSave = () => {
    saveStoredLlmOverride(draft);
    onChange(draft);
    setOpen(false);
  };

  const handleClear = () => {
    const empty = { apiKey: '', baseUrl: '', model: '' };
    saveStoredLlmOverride(empty);
    setDraft(empty);
    onChange(empty);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
        style={{
          borderColor: hasCustomKey ? 'var(--arena-accent-alt)' : 'var(--arena-border)',
          backgroundColor: 'var(--arena-surface)',
          color: 'var(--arena-ink)',
        }}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>{hasCustomKey ? `Custom key (${value.model || 'custom'})` : 'Model settings'}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: isLight ? 'rgba(22,24,29,0.35)' : 'rgba(5,7,9,0.72)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md border p-6"
            style={{
              backgroundColor: 'var(--arena-canvas)',
              borderColor: 'var(--arena-border)',
              color: 'var(--arena-ink)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--arena-border)' }}>
              <div>
                <h2 className="font-serif text-xl font-semibold">Model connection</h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
                  Leave blank to use the server environment credentials, or enter your own OpenAI-compatible key. Stored only in this browser tab&apos;s sessionStorage and never saved to MongoDB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
                aria-label="Close model settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--arena-muted)' }}>
                  API Key (OpenAI-compatible)
                </span>
                <input
                  type="password"
                  value={draft.apiKey}
                  onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full border px-3 py-2 font-mono text-xs outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--arena-surface)',
                    borderColor: 'var(--arena-border)',
                    color: 'var(--arena-ink)',
                  }}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--arena-muted)' }}>
                  Base URL
                </span>
                <input
                  type="url"
                  value={draft.baseUrl}
                  onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full border px-3 py-2 font-mono text-xs outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--arena-surface)',
                    borderColor: 'var(--arena-border)',
                    color: 'var(--arena-ink)',
                  }}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--arena-muted)' }}>
                  Model ID
                </span>
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                  placeholder="gpt-4o-mini / deepseek-chat / gemini-2.5-flash"
                  className="w-full border px-3 py-2 font-mono text-xs outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--arena-surface)',
                    borderColor: 'var(--arena-border)',
                    color: 'var(--arena-ink)',
                  }}
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--arena-border)' }}>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs underline underline-offset-4 opacity-75 hover:opacity-100 cursor-pointer"
              >
                Reset to server default
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--arena-accent)',
                  color: '#FFFFFF',
                }}
              >
                Save connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
