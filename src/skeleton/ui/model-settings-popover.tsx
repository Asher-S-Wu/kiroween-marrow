'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  CURATED_OPENROUTER_MODELS,
  DEFAULT_ENSEMBLE_LINEUP,
  DEFAULT_SINGLE_MODEL,
  shortModelLabel,
  type DeliberationRoutingMode,
} from '@/skeleton/llm/models';

export interface ClientLlmOverride {
  mode: DeliberationRoutingMode;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'marrow_openrouter_config_v2';

export function getDefaultClientLlmOverride(): ClientLlmOverride {
  return {
    mode: 'ensemble',
    apiKey: '',
    model: DEFAULT_SINGLE_MODEL,
  };
}

export function loadStoredLlmOverride(): ClientLlmOverride {
  if (typeof window === 'undefined') {
    return getDefaultClientLlmOverride();
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultClientLlmOverride();
    const parsed = JSON.parse(raw) as Partial<ClientLlmOverride>;
    return {
      mode: parsed.mode === 'single' ? 'single' : 'ensemble',
      apiKey: parsed.apiKey ?? '',
      model: parsed.model || DEFAULT_SINGLE_MODEL,
    };
  } catch {
    return getDefaultClientLlmOverride();
  }
}

export function saveStoredLlmOverride(override: ClientLlmOverride): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(override));
}

export function buildLlmHeaders(override: ClientLlmOverride): Record<string, string> {
  const headers: Record<string, string> = {
    'x-llm-mode': override.mode,
  };
  if (override.apiKey.trim()) headers['x-llm-api-key'] = override.apiKey.trim();
  if (override.mode === 'single' && override.model.trim()) {
    headers['x-llm-model'] = override.model.trim();
  }
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
  const buttonLabel =
    value.mode === 'ensemble'
      ? hasCustomKey
        ? '4-Model Ensemble (Key set)'
        : '4-Model Ensemble'
      : `${shortModelLabel(value.model)}${hasCustomKey ? ' (Key set)' : ''}`;

  const handleOpen = () => {
    setDraft(value);
    setOpen(true);
  };

  const handleSave = () => {
    saveStoredLlmOverride(draft);
    onChange(draft);
    setOpen(false);
  };

  const handleReset = () => {
    const def = getDefaultClientLlmOverride();
    saveStoredLlmOverride(def);
    setDraft(def);
    onChange(def);
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
        <span className="font-mono text-[11px]">{buttonLabel}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: isLight ? 'rgba(22,24,29,0.38)' : 'rgba(5,7,9,0.76)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl border p-6 my-8"
            style={{
              backgroundColor: 'var(--arena-canvas)',
              borderColor: 'var(--arena-border)',
              color: 'var(--arena-ink)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-4 pb-4 border-b"
              style={{ borderColor: 'var(--arena-border)' }}
            >
              <div>
                <h2 className="font-serif text-xl font-semibold">OpenRouter model routing</h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
                  Curated November 2026 models benchmarked on Artificial Analysis v5.0.1. Leave API key blank to use the server&apos;s <code className="font-mono">OPENROUTER_API_KEY</code>, or supply your own tab-scoped key.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
                aria-label="Close model routing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="mt-5 grid grid-cols-2 border" style={{ borderColor: 'var(--arena-border)' }}>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, mode: 'ensemble' })}
                className="px-4 py-2.5 text-left transition-colors cursor-pointer border-r"
                style={{
                  borderColor: 'var(--arena-border)',
                  backgroundColor: draft.mode === 'ensemble' ? 'var(--arena-elevated)' : 'var(--arena-surface)',
                }}
              >
                <div className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
                  4-Model Ensemble
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--arena-muted)' }}>
                  3 distinct examiner families + frontier arbiter
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, mode: 'single' })}
                className="px-4 py-2.5 text-left transition-colors cursor-pointer"
                style={{
                  backgroundColor: draft.mode === 'single' ? 'var(--arena-elevated)' : 'var(--arena-surface)',
                }}
              >
                <div className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
                  Single Model
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: 'var(--arena-muted)' }}>
                  One OpenRouter model across all 4 seats
                </div>
              </button>
            </div>

            {/* Ensemble Lineup Preview OR Single Model Picker */}
            {draft.mode === 'ensemble' ? (
              <div
                className="mt-4 border divide-y text-xs"
                style={{
                  borderColor: 'var(--arena-border)',
                  backgroundColor: 'var(--arena-surface)',
                }}
              >
                {[
                  {
                    seat: 'Examiner 1',
                    model: DEFAULT_ENSEMBLE_LINEUP.examiners[0],
                    meta: 'AA 36.5 · $0.10 / $0.50',
                  },
                  {
                    seat: 'Examiner 2',
                    model: DEFAULT_ENSEMBLE_LINEUP.examiners[1],
                    meta: 'AA 36.0 · $0.10 / $0.50',
                  },
                  {
                    seat: 'Examiner 3',
                    model: DEFAULT_ENSEMBLE_LINEUP.examiners[2],
                    meta: 'AA 32.6 · $0.15 / $0.60',
                  },
                  {
                    seat: 'Round 3 Arbiter',
                    model: DEFAULT_ENSEMBLE_LINEUP.judge,
                    meta: 'AA 51.3 · $1.00 / $5.00 (1 call)',
                  },
                ].map((row) => (
                  <div
                    key={row.seat}
                    className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
                    style={{ borderColor: 'var(--arena-border)' }}
                  >
                    <div>
                      <span className="font-semibold" style={{ color: 'var(--arena-ink)' }}>
                        {row.seat}
                      </span>
                      <span className="ml-2 font-mono text-[11px]" style={{ color: 'var(--arena-accent)' }}>
                        {row.model}
                      </span>
                    </div>
                    <span className="font-mono text-[10.5px]" style={{ color: 'var(--arena-muted)' }}>
                      {row.meta}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div
                  className="max-h-52 overflow-y-auto border divide-y"
                  style={{ borderColor: 'var(--arena-border)' }}
                >
                  {CURATED_OPENROUTER_MODELS.map((m) => {
                    const selected = draft.model === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, model: m.id })}
                        className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        style={{
                          borderColor: 'var(--arena-border)',
                          backgroundColor: selected ? 'var(--arena-elevated)' : 'var(--arena-surface)',
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
                              {m.label}
                            </span>
                            <span className="font-mono text-[10.5px] truncate" style={{ color: 'var(--arena-muted)' }}>
                              {m.id}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px]" style={{ color: 'var(--arena-muted)' }}>
                            {m.note}
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono text-[10.5px]">
                          <div style={{ color: m.isFree ? 'var(--arena-accent-alt)' : 'var(--arena-accent)' }}>
                            {m.priceLabel}
                          </div>
                          <div style={{ color: 'var(--arena-muted)' }}>{m.aaScore}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label className="block">
                  <span className="block text-[11px] font-medium mb-1" style={{ color: 'var(--arena-muted)' }}>
                    Or enter any OpenRouter model slug
                  </span>
                  <input
                    type="text"
                    value={draft.model}
                    onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                    placeholder="meta/muse-ember"
                    className="w-full border px-3 py-1.5 font-mono text-xs outline-none focus:ring-1"
                    style={{
                      backgroundColor: 'var(--arena-surface)',
                      borderColor: 'var(--arena-border)',
                      color: 'var(--arena-ink)',
                    }}
                  />
                </label>
              </div>
            )}

            <div className="mt-5">
              <label className="block">
                <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--arena-muted)' }}>
                  OpenRouter API Key (optional BYOK)
                </span>
                <input
                  type="password"
                  value={draft.apiKey}
                  onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full border px-3 py-2 font-mono text-xs outline-none focus:ring-1"
                  style={{
                    backgroundColor: 'var(--arena-surface)',
                    borderColor: 'var(--arena-border)',
                    color: 'var(--arena-ink)',
                  }}
                />
              </label>

            </div>

            <div
              className="mt-6 flex items-center justify-between gap-3 pt-4 border-t"
              style={{ borderColor: 'var(--arena-border)' }}
            >
              <button
                type="button"
                onClick={handleReset}
                className="text-xs underline underline-offset-4 opacity-75 hover:opacity-100 cursor-pointer"
              >
                Reset to 4-Model Ensemble
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: isLight ? '#16181D' : 'var(--arena-accent)',
                  color: '#F7F5F0',
                }}
              >
                Apply routing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
