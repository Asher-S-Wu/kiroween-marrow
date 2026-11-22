import Link from 'next/link';
import Image from 'next/image';
import { MarrowMark } from '@/skeleton/ui/marrow-mark';
import { postmortemCourtSpec } from '@/apps/postmortem-court/domain.spec';
import { defenseTribunalSpec } from '@/apps/defense-tribunal/domain.spec';
import { listPublicSessions } from '@/skeleton/storage/session-repo';
import type { SessionRecord } from '@/skeleton/schema/session';

export const dynamic = 'force-dynamic';

export default async function MarrowPortalPage() {
  let dossiers: SessionRecord[] = [];
  let dbError: string | null = null;

  try {
    dossiers = await listPublicSessions({ limit: 8 });
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Unable to reach MongoDB archive';
  }

  return (
    <div className="min-h-screen bg-[#121417] text-[#EAE6DF] drafting-grid">
      {/* Header */}
      <header className="border-b border-[#262C36] bg-[#121417]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <MarrowMark className="w-7 h-7" strokeColor="#EAE6DF" focalColor="#E5484D" />
            <span className="font-serif text-xl font-semibold tracking-tight text-[#EAE6DF]">
              Marrow
            </span>
          </Link>

          <nav className="flex items-center gap-7 text-sm text-[#8B949E]">
            <Link href="/court" className="hover:text-[#EAE6DF] transition-colors">
              Postmortem Court
            </Link>
            <Link href="/defense" className="hover:text-[#EAE6DF] transition-colors">
              Defense Tribunal
            </Link>
            <a href="#skeleton" className="hidden sm:inline hover:text-[#EAE6DF] transition-colors">
              Architecture
            </a>
            <a href="#dossiers" className="hidden sm:inline hover:text-[#EAE6DF] transition-colors">
              Archive
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-[1380px] mx-auto px-6 lg:px-12">
        {/* Hero: Asymmetric Editorial Monograph + Canva Brand Plate */}
        <section className="py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-[#262C36]">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-medium leading-[1.06] tracking-[-0.02em] text-[#EAE6DF]">
              One deliberation skeleton.
              <br />
              Two unforgiving arenas.
            </h1>

            <p className="text-base sm:text-[17px] leading-[1.7] text-[#8B949E] max-w-[62ch]">
              Marrow separates multi-agent cross-examination, source-cited causal evidence graphs, and MongoDB dossier persistence from domain logic. Swap one declarative <code className="font-mono text-[13.5px] text-[#EAE6DF] bg-[#1C2026] px-1.5 py-0.5 border border-[#262C36]">DomainSpec</code> and visual register to instantiate a completely distinct analytical tribunal.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/court"
                className="px-5 py-3 bg-[#E5484D] text-[#EAE6DF] text-sm font-semibold hover:bg-[#d63e43] transition-colors"
              >
                Open incident court
              </Link>
              <Link
                href="/defense"
                className="px-5 py-3 bg-[#F7F5F0] text-[#16181D] text-sm font-semibold hover:bg-[#EAE6DF] transition-colors"
              >
                Enter defense desk
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <figure className="border border-[#262C36] bg-[#0D1114] overflow-hidden">
              <Image
                src="/images/marrow-og.png"
                alt="Marrow geometric spine emblem and architectural blueprint"
                width={1600}
                height={900}
                priority
                className="w-full h-auto block"
              />
              <figcaption className="px-4 py-2.5 border-t border-[#262C36] flex items-center justify-between font-mono text-[11px] text-[#8B949E]">
                <span>Single Next.js App Router service</span>
                <span>MongoDB + SSE streaming</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Diptych Split Stage: Forensic Dark vs Editorial Light side by side */}
        <section className="py-16 lg:py-20 border-b border-[#262C36]">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#EAE6DF]">
                Two applications from one codebase
              </h2>
              <p className="mt-2 text-sm text-[#8B949E] max-w-[65ch]">
                Both arenas share identical orchestration, evidence slicing, SVG graph rendering, and API route factories—differing only in their declarative specification, prompt personas, verdict schema, and surface register.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#262C36]">
            {/* Arena 1: Postmortem Court */}
            <article className="bg-[#0D1114] text-[#EAE6DF] p-8 lg:p-11 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-r border-[#262C36] forensic-grid">
              <div className="space-y-5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#E5484D]">{postmortemCourtSpec.registerLabel}</span>
                  <span className="text-[#8B949E]">Line-sliced docket</span>
                </div>

                <h3 className="font-serif text-3xl lg:text-4xl font-semibold text-[#EAE6DF]">
                  {postmortemCourtSpec.name}
                </h3>

                <p className="text-sm leading-[1.7] text-[#8B949E] max-w-[54ch]">
                  {postmortemCourtSpec.description}
                </p>

                <div className="pt-2 space-y-2.5 border-t border-[#262C36]">
                  {postmortemCourtSpec.personas.map((p) => (
                    <div key={p.id} className="flex items-baseline justify-between gap-4 text-xs">
                      <span className="font-semibold text-[#EAE6DF]">{p.name}</span>
                      <span className="font-mono text-[11px]" style={{ color: p.accentHex }}>
                        {p.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#262C36]">
                <span className="font-mono text-[11px] text-[#2DD4BF]">
                  Outputs: Root-cause graph + Postmortem .md
                </span>
                <Link
                  href="/court"
                  className="px-4 py-2.5 bg-[#E5484D] text-[#EAE6DF] text-xs font-semibold hover:bg-[#d63e43] transition-colors"
                >
                  Open incident court
                </Link>
              </div>
            </article>

            {/* Arena 2: Defense Tribunal */}
            <article className="bg-[#F7F5F0] text-[#16181D] p-8 lg:p-11 flex flex-col justify-between gap-8 editorial-paper">
              <div className="space-y-5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[#B91C1C]">{defenseTribunalSpec.registerLabel}</span>
                  <span className="text-[#4B5162]">Passage-sliced manuscript</span>
                </div>

                <h3 className="font-serif text-3xl lg:text-4xl font-semibold text-[#16181D]">
                  {defenseTribunalSpec.name}
                </h3>

                <p className="font-serif text-[15.5px] leading-[1.7] text-[#4B5162] max-w-[54ch]">
                  {defenseTribunalSpec.description}
                </p>

                <div className="pt-2 space-y-2.5 border-t border-[#D8D2C7]">
                  {defenseTribunalSpec.personas.map((p) => (
                    <div key={p.id} className="flex items-baseline justify-between gap-4 text-xs">
                      <span className="font-semibold text-[#16181D]">{p.name}</span>
                      <span className="font-mono text-[11px]" style={{ color: p.accentHex }}>
                        {p.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D8D2C7]">
                <span className="font-mono text-[11px] text-[#1D4ED8]">
                  Outputs: Claim fragility graph + Rebuttal .md
                </span>
                <Link
                  href="/defense"
                  className="px-4 py-2.5 bg-[#16181D] text-[#F7F5F0] text-xs font-semibold hover:bg-[#2a2e38] transition-colors"
                >
                  Enter defense desk
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* Skeleton Anatomy Breakdown */}
        <section id="skeleton" className="py-16 lg:py-20 border-b border-[#262C36]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-3">
              <h2 className="font-serif text-3xl font-medium text-[#EAE6DF]">
                Skeleton anatomy
              </h2>
              <p className="text-sm leading-relaxed text-[#8B949E]">
                Every shared capability lives under <code className="font-mono text-xs text-[#EAE6DF]">src/skeleton/</code>. Adding a third arena requires zero changes to orchestration, storage, streaming, or graph layout.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-[#262C36]">
              {[
                {
                  path: 'src/skeleton/engine/slicer.ts',
                  title: 'Addressable evidence slicer',
                  detail:
                    'Partitions raw logs or prose into immutable [E1..En] blocks so every agent claim can be cross-linked back to source lines.',
                },
                {
                  path: 'src/skeleton/engine/orchestrator.ts',
                  title: 'Three-round SSE state machine',
                  detail:
                    'Streams Round 1 independent analysis, Round 2 peer cross-examination, and Round 3 Zod-validated graph & verdict JSON.',
                },
                {
                  path: 'src/skeleton/api/create-handlers.ts',
                  title: 'Declarative route factory',
                  detail:
                    'Bind any DomainSpec into createDeliberationHandlers(spec) to expose full REST creation, archive listing, and SSE endpoints.',
                },
                {
                  path: 'src/skeleton/ui/evidence-graph.tsx',
                  title: 'Zero-dependency SVG causal map',
                  detail:
                    'Lays out evidence, diagnoses, and remediations into a 3-stage interactive topology that adapts automatically to light and dark tokens.',
                },
              ].map((mod) => (
                <div
                  key={mod.path}
                  className="p-6 border-r border-b border-[#262C36] bg-[#15181C]/70 space-y-2"
                >
                  <div className="font-mono text-[11px] text-[#3B82F6]">{mod.path}</div>
                  <h3 className="text-sm font-semibold text-[#EAE6DF]">{mod.title}</h3>
                  <p className="text-xs leading-relaxed text-[#8B949E]">{mod.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Public MongoDB Dossier Archive */}
        <section id="dossiers" className="py-16 lg:py-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-3xl font-medium text-[#EAE6DF]">
                Public dossier archive
              </h2>
              <p className="mt-1.5 text-sm text-[#8B949E]">
                Completed hearings persisted in MongoDB with permanent shareable URLs.
              </p>
            </div>
            <span className="font-mono text-xs text-[#8B949E]">
              {dossiers.length} recorded
            </span>
          </div>

          {dbError ? (
            <div className="border border-[#E5484D]/50 bg-[#261215] p-5 text-xs font-mono text-[#FCA5A5]">
              MongoDB archive unavailable: {dbError}
            </div>
          ) : dossiers.length === 0 ? (
            <div className="border border-[#262C36] bg-[#15181C] p-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-serif text-lg text-[#EAE6DF]">No completed dossiers archived yet</p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  Start a live trial in Postmortem Court or Defense Tribunal to persist the first permanent record.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/court"
                  className="px-4 py-2 border border-[#E5484D] text-[#E5484D] text-xs font-medium hover:bg-[#E5484D] hover:text-[#EAE6DF] transition-colors"
                >
                  Run incident trial
                </Link>
                <Link
                  href="/defense"
                  className="px-4 py-2 border border-[#262C36] text-[#EAE6DF] text-xs font-medium hover:border-[#8B949E] transition-colors"
                >
                  Run defense panel
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-[#262C36] divide-y divide-[#262C36] bg-[#15181C]/70">
              {dossiers.map((doc) => {
                const isCourt = doc.appId === 'postmortem-court';
                const href = isCourt ? `/court/${doc._id}` : `/defense/${doc._id}`;
                return (
                  <Link
                    key={doc._id}
                    href={href}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-[#1C2026] transition-colors"
                  >
                    <div className="flex flex-wrap items-baseline gap-3 min-w-0">
                      <span
                        className="font-mono text-[11px] px-2 py-0.5 border shrink-0"
                        style={{
                          borderColor: isCourt ? '#E5484D' : '#D8D2C7',
                          backgroundColor: isCourt ? 'rgba(229,72,77,0.12)' : '#F7F5F0',
                          color: isCourt ? '#E5484D' : '#16181D',
                        }}
                      >
                        {isCourt ? 'Postmortem Court' : 'Defense Tribunal'}
                      </span>
                      <span className="text-sm font-medium text-[#EAE6DF] truncate">
                        {doc.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 font-mono text-[11px] text-[#8B949E] shrink-0">
                      <span>#{doc._id}</span>
                      <span>{doc.meta.model}</span>
                      <span>{doc.turns.length} turns</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#262C36] mt-10">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-12 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8B949E]">
          <span>Marrow — Multi-Agent Deliberation & Evidence-Graph Skeleton</span>
          <span className="font-mono">Next.js 16 App Router · Node.js · MongoDB</span>
        </div>
      </footer>
    </div>
  );
}
