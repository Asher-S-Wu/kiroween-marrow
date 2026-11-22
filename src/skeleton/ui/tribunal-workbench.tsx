'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Download, FilePlus2, Loader2, Share2 } from 'lucide-react';
import type { DomainSpec } from '@/skeleton/schema/domain';
import type { DeliberationTurn, EvidenceGraph, EvidenceItem, SessionRecord, StreamEvent } from '@/skeleton/schema/session';
import { DEFAULT_ENSEMBLE_LINEUP, shortModelLabel } from '@/skeleton/llm/models';
import { MarrowMark } from '@/skeleton/ui/marrow-mark';
import { EvidenceRail } from '@/skeleton/ui/evidence-rail';
import { DeliberationFeed, type StreamingTurnDraft } from '@/skeleton/ui/deliberation-feed';
import { EvidenceGraphView } from '@/skeleton/ui/evidence-graph';
import {
  buildLlmHeaders,
  getStoredLlmOverrideSnapshot,
  ModelSettingsPopover,
  parseStoredLlmOverride,
  subscribeStoredLlmOverride,
  type ClientLlmOverride,
} from '@/skeleton/ui/model-settings-popover';

export function TribunalWorkbench<TVerdict extends Record<string, unknown>>({
  spec,
  peerApp,
  initialSession,
  recentSessions,
  dbError,
  renderVerdict,
}: {
  spec: DomainSpec<TVerdict>;
  peerApp: { name: string; routePath: string };
  initialSession?: SessionRecord | null;
  recentSessions: SessionRecord[];
  dbError?: string | null;
  renderVerdict: (params: {
    verdict: TVerdict;
    activeEvidenceId: string | null;
    onSelectEvidence: (id: string | null) => void;
  }) => ReactNode;
}) {
  const isLight = spec.theme.mode === 'light';

  // Server and first client render see null (defaults); stored tab preferences apply after hydration.
  const storedLlmRaw = useSyncExternalStore(
    subscribeStoredLlmOverride,
    getStoredLlmOverrideSnapshot,
    () => null,
  );
  const llmOverride = useMemo(() => parseStoredLlmOverride(storedLlmRaw), [storedLlmRaw]);
  const [title, setTitle] = useState(spec.presets[0]?.title ?? '');
  const [rawInput, setRawInput] = useState(spec.presets[0]?.rawInput ?? '');
  const [isPublic, setIsPublic] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(initialSession?._id ?? null);
  const [sessionTitle, setSessionTitle] = useState<string>(initialSession?.title ?? '');
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(initialSession?.evidenceItems ?? []);
  const [turns, setTurns] = useState<DeliberationTurn[]>(initialSession?.turns ?? []);
  const [streamingTurn, setStreamingTurn] = useState<StreamingTurnDraft | null>(null);
  const [evidenceGraph, setEvidenceGraph] = useState<EvidenceGraph | undefined>(initialSession?.evidenceGraph);
  const [verdict, setVerdict] = useState<TVerdict | undefined>(initialSession?.verdict as TVerdict | undefined);
  const [activeRound, setActiveRound] = useState<0 | 1 | 2 | 3>(
    initialSession?.status === 'completed' ? 3 : 0,
  );
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialSession?.errorMessage ?? null);
  const [modelUsed, setModelUsed] = useState<string>(initialSession?.meta.model ?? '');
  const [judgeModelUsed, setJudgeModelUsed] = useState<string>(initialSession?.meta.judgeModel ?? '');
  const [durationMs, setDurationMs] = useState<number | undefined>(initialSession?.meta.durationMs);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const themeStyle: CSSProperties = {
    ['--arena-canvas' as string]: spec.theme.bgCanvas,
    ['--arena-surface' as string]: spec.theme.bgSurface,
    ['--arena-elevated' as string]: spec.theme.bgElevated,
    ['--arena-ink' as string]: spec.theme.textPrimary,
    ['--arena-muted' as string]: spec.theme.textSecondary,
    ['--arena-border' as string]: spec.theme.borderSubtle,
    ['--arena-accent' as string]: spec.theme.accentPrimary,
    ['--arena-accent-alt' as string]: spec.theme.accentSecondary,
    ['--arena-warn' as string]: spec.theme.accentWarn,
    backgroundColor: spec.theme.bgCanvas,
    color: spec.theme.textPrimary,
  };

  const validEvidenceIds = useMemo(() => new Set(evidenceItems.map((e) => e.id)), [evidenceItems]);

  const citedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const turn of turns) {
      for (const eid of turn.citedEvidenceIds) {
        counts[eid] = (counts[eid] ?? 0) + 1;
      }
    }
    return counts;
  }, [turns]);

  const assignedSeatModels = useMemo(() => {
    if (llmOverride.mode === 'single') {
      return {
        examiners: [llmOverride.model, llmOverride.model, llmOverride.model],
        judge: llmOverride.model,
      };
    }
    return DEFAULT_ENSEMBLE_LINEUP;
  }, [llmOverride.mode, llmOverride.model]);

  const consumeStream = useCallback(
    async (id: string, override: ClientLlmOverride) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setRunning(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`${spec.apiBasePath}/sessions/${id}/stream`, {
          method: 'GET',
          headers: buildLlmHeaders(override),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `Stream failed with HTTP ${res.status}`);
        }

        if (!res.body) {
          throw new Error('Server returned an empty event stream.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const dataLine = frame
              .split('\n')
              .find((l) => l.startsWith('data:'));
            if (!dataLine) continue;

            const event = JSON.parse(dataLine.slice(5).trim()) as StreamEvent;

            switch (event.type) {
              case 'session_started':
                setEvidenceItems(event.evidenceItems);
                setModelUsed(event.model);
                setJudgeModelUsed(event.judgeModel);
                break;
              case 'round_started':
                setActiveRound(event.round);
                break;
              case 'turn_started':
                setStreamingTurn({
                  id: event.turnId,
                  round: event.round,
                  agentId: event.agentId,
                  agentName: event.agentName,
                  agentTitle: event.agentTitle,
                  accentHex: event.accentHex,
                  model: event.model,
                  stance: event.stance,
                  challengesTurnId: event.challengesTurnId,
                  content: '',
                });
                break;
              case 'token':
                setStreamingTurn((prev) =>
                  prev && prev.id === event.turnId
                    ? { ...prev, content: prev.content + event.delta }
                    : prev,
                );
                break;
              case 'turn_complete':
                setTurns((prev) =>
                  prev.some((t) => t.id === event.turn.id) ? prev : [...prev, event.turn],
                );
                setStreamingTurn((prev) => (prev?.id === event.turn.id ? null : prev));
                break;
              case 'verdict_ready':
                setEvidenceGraph(event.evidenceGraph);
                setVerdict(event.verdict as TVerdict);
                setJudgeModelUsed(event.judgeModel);
                break;
              case 'session_complete':
                setDurationMs(event.durationMs);
                setRunning(false);
                break;
              case 'error':
                setErrorMsg(event.message);
                setRunning(false);
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setErrorMsg(err instanceof Error ? err.message : 'Deliberation interrupted.');
        }
      } finally {
        setRunning(false);
        setStreamingTurn(null);
      }
    },
    [spec.apiBasePath],
  );

  const handleStartDeliberation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRunning(true);

    try {
      const res = await fetch(`${spec.apiBasePath}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildLlmHeaders(llmOverride),
        },
        body: JSON.stringify({ title, rawInput, isPublic }),
      });

      const payload = (await res.json()) as { session?: SessionRecord; error?: string };
      if (!res.ok || !payload.session) {
        throw new Error(payload.error || `Failed to create session (HTTP ${res.status})`);
      }

      const created = payload.session;
      setSessionId(created._id);
      setSessionTitle(created.title);
      setEvidenceItems(created.evidenceItems);
      setTurns([]);
      setEvidenceGraph(undefined);
      setVerdict(undefined);
      setActiveRound(1);
      setActiveEvidenceId(null);
      setModelUsed(created.meta.model);
      setJudgeModelUsed(created.meta.judgeModel ?? created.meta.model);
      setDurationMs(undefined);

      window.history.replaceState(null, '', `${spec.routePath}/${created._id}`);
      await consumeStream(created._id, llmOverride);
    } catch (err) {
      setRunning(false);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start deliberation.');
    }
  };

  const handleResetToComposer = () => {
    abortRef.current?.abort();
    setSessionId(null);
    setSessionTitle('');
    setEvidenceItems([]);
    setTurns([]);
    setStreamingTurn(null);
    setEvidenceGraph(undefined);
    setVerdict(undefined);
    setActiveRound(0);
    setRunning(false);
    setErrorMsg(null);
    setActiveEvidenceId(null);
    window.history.replaceState(null, '', spec.routePath);
  };

  const handleCopyShareUrl = async () => {
    if (!sessionId) return;
    const url = `${window.location.origin}${spec.routePath}/${sessionId}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleExportMarkdown = () => {
    if (!sessionId || !verdict) return;
    const md = spec.formatMarkdownReport({
      title: sessionTitle || title,
      sessionId,
      createdAt: initialSession?.createdAt ?? new Date().toISOString(),
      evidenceItems,
      turns,
      verdict,
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inSession = sessionId !== null;

  return (
    <div
      style={themeStyle}
      className={`min-h-screen flex flex-col ${isLight ? 'editorial-paper' : 'forensic-grid'}`}
    >
      {/* Top Bar */}
      <header
        className="sticky top-0 z-30 border-b px-5 lg:px-7 py-3 flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--arena-surface)',
          borderColor: 'var(--arena-border)',
        }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium opacity-75 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--arena-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <MarrowMark
              className="w-5 h-5"
              strokeColor={isLight ? '#16181D' : '#EAE6DF'}
              focalColor={spec.theme.accentPrimary}
            />
            <span>Marrow</span>
          </Link>

          <span className="h-4 w-px" style={{ backgroundColor: 'var(--arena-border)' }} />

          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-lg sm:text-xl font-semibold truncate">{spec.name}</h1>
              {inSession && (
                <span className="hidden md:inline font-mono text-[11px] truncate" style={{ color: 'var(--arena-muted)' }}>
                  #{sessionId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Round stepper during active session */}
        {inSession && (
          <ol className="hidden xl:flex items-center gap-2">
            {spec.roundLabels.map((label, index) => {
              const roundNum = (index + 1) as 1 | 2 | 3;
              const isCurrent = activeRound === roundNum && running;
              const isDone = activeRound > roundNum || (!running && verdict !== undefined);

              return (
                <li
                  key={label}
                  className="px-2.5 py-1 border font-mono text-[11px]"
                  style={{
                    borderColor: isCurrent
                      ? 'var(--arena-accent)'
                      : isDone
                        ? 'var(--arena-accent-alt)'
                        : 'var(--arena-border)',
                    backgroundColor: isCurrent
                      ? isLight
                        ? 'rgba(185,28,28,0.1)'
                        : 'rgba(229,72,77,0.16)'
                      : 'var(--arena-canvas)',
                    color: isCurrent
                      ? 'var(--arena-accent)'
                      : isDone
                        ? 'var(--arena-accent-alt)'
                        : 'var(--arena-muted)',
                  }}
                >
                  {label}
                </li>
              );
            })}
          </ol>
        )}

        <div className="flex items-center gap-2.5">
          {inSession && (
            <button
              type="button"
              onClick={handleResetToComposer}
              className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium cursor-pointer"
              style={{
                borderColor: 'var(--arena-border)',
                backgroundColor: 'var(--arena-canvas)',
                color: 'var(--arena-ink)',
              }}
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>New case</span>
            </button>
          )}
          <ModelSettingsPopover value={llmOverride} isLight={isLight} />
          <Link
            href={peerApp.routePath}
            className="hidden sm:inline-flex items-center border px-3 py-1.5 text-xs font-medium"
            style={{
              borderColor: 'var(--arena-border)',
              color: 'var(--arena-muted)',
            }}
          >
            Switch to {peerApp.name}
          </Link>
        </div>
      </header>

      {/* Error banner */}
      {errorMsg && (
        <div
          className="px-6 py-3 border-b text-xs flex flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: isLight ? '#FEF2F2' : '#261215',
            borderColor: 'var(--arena-accent)',
            color: isLight ? '#991B1B' : '#FCA5A5',
          }}
        >
          <span className="font-mono">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="underline underline-offset-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content: Either Composer View or 3-Column Live Workbench */}
      {!inSession ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-5 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left/Main: Submission Composer */}
            <div className="lg:col-span-8 space-y-8">
              <div>
                <p className="font-mono text-xs mb-2" style={{ color: 'var(--arena-accent)' }}>
                  {spec.registerLabel}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-medium leading-tight">
                  {spec.tagline}
                </h2>
                <p className="mt-3 text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--arena-muted)' }}>
                  {spec.description}
                </p>
              </div>

              {/* Preset one-click case loaders */}
              <div className="space-y-2.5">
                <div className="text-xs font-medium" style={{ color: 'var(--arena-muted)' }}>
                  Load a curated case into the editor
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {spec.presets.map((preset) => {
                    const selected = title === preset.title && rawInput === preset.rawInput;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setTitle(preset.title);
                          setRawInput(preset.rawInput);
                        }}
                        className="text-left border p-3.5 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: selected ? 'var(--arena-elevated)' : 'var(--arena-surface)',
                          borderColor: selected ? 'var(--arena-accent)' : 'var(--arena-border)',
                        }}
                      >
                        <div className="text-xs font-semibold" style={{ color: 'var(--arena-ink)' }}>
                          {preset.label}
                        </div>
                        <p className="mt-1 text-[11.5px] leading-snug" style={{ color: 'var(--arena-muted)' }}>
                          {preset.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleStartDeliberation} className="space-y-5">
                <label className="block">
                  <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--arena-ink)' }}>
                    Case title
                  </span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={140}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border px-3.5 py-2.5 text-sm outline-none focus:ring-1"
                    style={{
                      backgroundColor: 'var(--arena-surface)',
                      borderColor: 'var(--arena-border)',
                      color: 'var(--arena-ink)',
                    }}
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--arena-ink)' }}>
                    {spec.inputLabel}
                  </span>
                  <textarea
                    required
                    minLength={40}
                    maxLength={16000}
                    rows={12}
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder={spec.inputPlaceholder}
                    className={`w-full border p-4 outline-none focus:ring-1 leading-relaxed ${
                      isLight ? 'font-serif text-[14.5px]' : 'font-mono text-xs'
                    }`}
                    style={{
                      backgroundColor: 'var(--arena-surface)',
                      borderColor: 'var(--arena-border)',
                      color: 'var(--arena-ink)',
                    }}
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--arena-muted)' }}>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="accent-current"
                    />
                    <span>Publish completed dossier to public archive</span>
                  </label>

                  <button
                    type="submit"
                    disabled={running}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-opacity disabled:opacity-50 cursor-pointer"
                    style={{
                      backgroundColor: isLight ? '#16181D' : spec.theme.accentPrimary,
                      color: '#F7F5F0',
                    }}
                  >
                    {running && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{spec.submitActionLabel}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Sidebar: Seated Examiners + Assigned OpenRouter Models + Archived Dossiers */}
            <aside className="lg:col-span-4 space-y-8">
              <div
                className="border p-5 space-y-4"
                style={{ backgroundColor: 'var(--arena-surface)', borderColor: 'var(--arena-border)' }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg font-semibold">Seated examiners</h3>
                  <span className="font-mono text-[10.5px]" style={{ color: 'var(--arena-muted)' }}>
                    OpenRouter
                  </span>
                </div>

                <div className="space-y-4">
                  {spec.personas.map((persona, idx) => {
                    const seatModel = assignedSeatModels.examiners[idx];
                    return (
                      <div
                        key={persona.id}
                        className="pl-3.5 border-l-2"
                        style={{ borderLeftColor: persona.accentHex }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-semibold">{persona.name}</span>
                          <span className="font-mono text-[10.5px]" style={{ color: persona.accentHex }}>
                            {persona.title}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
                          {persona.lens}
                        </p>
                        <div className="mt-1.5 font-mono text-[10.5px]" style={{ color: 'var(--arena-ink)', opacity: 0.78 }}>
                          Model: {shortModelLabel(seatModel)}
                        </div>
                      </div>
                    );
                  })}

                  <div
                    className="pt-3 border-t flex items-baseline justify-between gap-2 text-xs"
                    style={{ borderColor: 'var(--arena-border)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--arena-muted)' }}>
                      Round 3 Arbiter
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--arena-accent-alt)' }}>
                      {shortModelLabel(assignedSeatModels.judge)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="border p-5 space-y-3"
                style={{ backgroundColor: 'var(--arena-surface)', borderColor: 'var(--arena-border)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold">Archived dossiers</h3>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--arena-muted)' }}>
                    MongoDB
                  </span>
                </div>

                {dbError ? (
                  <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--arena-accent)' }}>
                    MongoDB unavailable: {dbError}
                  </p>
                ) : recentSessions.length === 0 ? (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
                    No completed public dossiers yet. Convene a panel on the left to archive the first case.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--arena-border)' }}>
                    {recentSessions.map((item) => (
                      <Link
                        key={item._id}
                        href={`${spec.routePath}/${item._id}`}
                        className="block py-3 first:pt-1 last:pb-0 group"
                      >
                        <div className="text-xs font-semibold group-hover:underline underline-offset-4">
                          {item.title}
                        </div>
                        <div className="mt-1 flex items-center justify-between font-mono text-[10.5px]" style={{ color: 'var(--arena-muted)' }}>
                          <span>#{item._id}</span>
                          <span>{item.meta.model}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      ) : (
        /* Active / Archived 3-Column Tribunal Workbench */
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Column 1: Evidence Rail */}
          <div className="lg:col-span-3 lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px]">
            <EvidenceRail
              evidenceItems={evidenceItems}
              unitLabel={spec.evidenceUnitLabel}
              isLight={isLight}
              activeEvidenceId={activeEvidenceId}
              citedCounts={citedCounts}
              onSelectEvidence={setActiveEvidenceId}
            />
          </div>

          {/* Column 2: Deliberation Transcript Spine */}
          <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r min-h-[60vh]" style={{ borderColor: 'var(--arena-border)' }}>
            <div
              className="px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3"
              style={{ borderColor: 'var(--arena-border)', backgroundColor: 'var(--arena-canvas)' }}
            >
              <div className="min-w-0">
                <h2 className="font-serif text-lg font-semibold truncate">{sessionTitle || title}</h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 font-mono text-[11px]" style={{ color: 'var(--arena-muted)' }}>
                  {modelUsed && <span>{modelUsed}</span>}
                  {judgeModelUsed && judgeModelUsed !== modelUsed && (
                    <span>Arbiter: {shortModelLabel(judgeModelUsed)}</span>
                  )}
                  {durationMs !== undefined && <span>{(durationMs / 1000).toFixed(1)}s</span>}
                  {running && (
                    <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--arena-accent)' }}>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Deliberating
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                  style={{ borderColor: 'var(--arena-border)', color: 'var(--arena-ink)' }}
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Share URL'}</span>
                </button>
                {verdict && (
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                    style={{
                      borderColor: 'var(--arena-accent-alt)',
                      color: 'var(--arena-accent-alt)',
                    }}
                  >
                    <Download className="w-3 h-3" />
                    <span>Export .md</span>
                  </button>
                )}
              </div>
            </div>

            <DeliberationFeed
              turns={turns}
              streamingTurn={streamingTurn}
              roundLabels={spec.roundLabels}
              isLight={isLight}
              validEvidenceIds={validEvidenceIds}
              activeEvidenceId={activeEvidenceId}
              onSelectEvidence={setActiveEvidenceId}
            />
          </div>

          {/* Column 3: Interactive Causal Graph + Domain Verdict */}
          <div
            className="lg:col-span-4 lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px] overflow-y-auto p-5 space-y-5"
            style={{ backgroundColor: 'var(--arena-surface)' }}
          >
            <EvidenceGraphView
              graph={evidenceGraph}
              isLight={isLight}
              activeEvidenceId={activeEvidenceId}
              onSelectEvidence={setActiveEvidenceId}
            />

            {verdict ? (
              renderVerdict({
                verdict,
                activeEvidenceId,
                onSelectEvidence: setActiveEvidenceId,
              })
            ) : (
              <div
                className="border p-5"
                style={{ backgroundColor: 'var(--arena-canvas)', borderColor: 'var(--arena-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-base font-semibold">{spec.judgeTitle}</span>
                  {running && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--arena-accent)' }} />}
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
                  {running
                    ? `Synthesizing final adjudication and evidence graph via ${shortModelLabel(judgeModelUsed || assignedSeatModels.judge)} once both examination rounds conclude.`
                    : 'No final adjudication recorded for this dossier.'}
                </p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
