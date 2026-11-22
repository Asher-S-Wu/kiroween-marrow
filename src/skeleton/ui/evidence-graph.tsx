'use client';

import { useMemo, useState } from 'react';
import type { EvidenceGraph, EvidenceGraphNode } from '@/skeleton/schema/session';

interface PositionedNode extends EvidenceGraphNode {
  x: number;
  y: number;
  w: number;
  h: number;
  column: 0 | 1 | 2;
}

function getColumn(type: EvidenceGraphNode['type']): 0 | 1 | 2 {
  if (type === 'evidence') return 0;
  if (type === 'remediation') return 2;
  return 1;
}

function getNodePalette(
  node: EvidenceGraphNode,
  isLight: boolean,
): { bg: string; stroke: string; text: string; tag: string } {
  if (node.type === 'evidence') {
    return isLight
      ? { bg: '#FFFFFF', stroke: '#1D4ED8', text: '#16181D', tag: '#1D4ED8' }
      : { bg: '#151B20', stroke: '#3B82F6', text: '#EAE6DF', tag: '#60A5FA' };
  }
  if (node.type === 'remediation') {
    return isLight
      ? { bg: '#EFF6FF', stroke: '#1D4ED8', text: '#16181D', tag: '#1D4ED8' }
      : { bg: '#0E2424', stroke: '#2DD4BF', text: '#EAE6DF', tag: '#2DD4BF' };
  }
  if (node.type === 'root_cause' || node.type === 'vulnerability' || node.severity === 'high') {
    return isLight
      ? { bg: '#FEF2F2', stroke: '#B91C1C', text: '#16181D', tag: '#B91C1C' }
      : { bg: '#261215', stroke: '#E5484D', text: '#EAE6DF', tag: '#E5484D' };
  }
  return isLight
    ? { bg: '#FFFBEB', stroke: '#B45309', text: '#16181D', tag: '#B45309' }
    : { bg: '#1F1B12', stroke: '#F59E0B', text: '#EAE6DF', tag: '#F59E0B' };
}

function getEdgeStyle(relation: string, isLight: boolean): { stroke: string; dash?: string } {
  if (relation === 'causes') {
    return { stroke: isLight ? '#B91C1C' : '#E5484D' };
  }
  if (relation === 'contradicts') {
    return { stroke: isLight ? '#B45309' : '#F59E0B', dash: '4 3' };
  }
  if (relation === 'mitigates') {
    return { stroke: isLight ? '#1D4ED8' : '#2DD4BF' };
  }
  return { stroke: isLight ? '#8C857B' : '#4B5563' };
}

export function EvidenceGraphView({
  graph,
  isLight,
  activeEvidenceId,
  onSelectEvidence,
}: {
  graph?: EvidenceGraph;
  isLight: boolean;
  activeEvidenceId: string | null;
  onSelectEvidence: (evidenceId: string | null) => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const layout = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null;

    const cols: [EvidenceGraphNode[], EvidenceGraphNode[], EvidenceGraphNode[]] = [[], [], []];
    for (const node of graph.nodes) {
      cols[getColumn(node.type)].push(node);
    }

    const colX = [16, 204, 392];
    const nodeW = 152;
    const nodeH = 54;
    const gapY = 18;
    const maxCount = Math.max(cols[0].length, cols[1].length, cols[2].length, 1);
    const totalH = Math.max(250, maxCount * nodeH + (maxCount + 1) * gapY + 26);

    const positioned: PositionedNode[] = [];
    const byId = new Map<string, PositionedNode>();

    cols.forEach((colNodes, cIdx) => {
      const colH = colNodes.length * nodeH + Math.max(0, colNodes.length - 1) * gapY;
      const startY = 26 + (totalH - 26 - colH) / 2;
      colNodes.forEach((node, rIdx) => {
        const p: PositionedNode = {
          ...node,
          x: colX[cIdx],
          y: startY + rIdx * (nodeH + gapY),
          w: nodeW,
          h: nodeH,
          column: cIdx as 0 | 1 | 2,
        };
        positioned.push(p);
        byId.set(p.id, p);
      });
    });

    return { width: 560, height: totalH, positioned, byId };
  }, [graph]);

  const highlightedSet = useMemo(() => {
    const focus = selectedNodeId || activeEvidenceId;
    if (!focus || !graph) return null;
    const set = new Set<string>([focus]);
    for (const n of graph.nodes) {
      if (n.evidenceRef === focus) set.add(n.id);
    }
    for (const edge of graph.edges) {
      if (set.has(edge.source) || set.has(edge.target)) {
        set.add(edge.source);
        set.add(edge.target);
      }
    }
    return set;
  }, [selectedNodeId, activeEvidenceId, graph]);

  const selectedNode = layout?.positioned.find((n) => n.id === selectedNodeId) ?? null;

  if (!layout || !graph) {
    return (
      <div
        className="border p-5"
        style={{
          backgroundColor: 'var(--arena-canvas)',
          borderColor: 'var(--arena-border)',
        }}
      >
        <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--arena-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--arena-ink)' }}>
            Evidence chain topology
          </span>
          <span className="font-mono">Awaiting Round 3 synthesis</span>
        </div>
        <div
          className="h-48 border border-dashed flex flex-col items-center justify-center text-center px-6"
          style={{ borderColor: 'var(--arena-border)', color: 'var(--arena-muted)' }}
        >
          <p className="font-serif text-base" style={{ color: 'var(--arena-ink)' }}>
            Causal map crystallizes after cross-examination
          </p>
          <p className="mt-1.5 text-xs max-w-xs leading-relaxed">
            Once Round 1 and Round 2 complete, the arbiter maps every cited evidence block to root causes and concrete fixes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border"
      style={{
        backgroundColor: 'var(--arena-canvas)',
        borderColor: 'var(--arena-border)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b text-xs"
        style={{ borderColor: 'var(--arena-border)' }}
      >
        <span className="font-medium" style={{ color: 'var(--arena-ink)' }}>
          Causal evidence graph
        </span>
        <div className="flex items-center gap-3 font-mono text-[11px]" style={{ color: 'var(--arena-muted)' }}>
          <span>{graph.nodes.length} nodes</span>
          <span>{graph.edges.length} links</span>
          {selectedNodeId && (
            <button
              type="button"
              onClick={() => {
                setSelectedNodeId(null);
                onSelectEvidence(null);
              }}
              className="underline underline-offset-2 cursor-pointer"
              style={{ color: 'var(--arena-accent)' }}
            >
              Clear focus
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto p-3">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full h-auto min-w-[460px]"
          role="img"
          aria-label="Interactive evidence chain graph"
        >
          {/* Column headers */}
          <text x={16} y={14} fontSize={10} fontFamily="var(--font-jetbrains)" fill={isLight ? '#4B5162' : '#8B949E'}>
            Evidence
          </text>
          <text x={204} y={14} fontSize={10} fontFamily="var(--font-jetbrains)" fill={isLight ? '#4B5162' : '#8B949E'}>
            Diagnosis / Flaws
          </text>
          <text x={392} y={14} fontSize={10} fontFamily="var(--font-jetbrains)" fill={isLight ? '#4B5162' : '#8B949E'}>
            Remediation
          </text>

          {/* Curved causal edges */}
          {graph.edges.map((edge, idx) => {
            const src = layout.byId.get(edge.source);
            const tgt = layout.byId.get(edge.target);
            if (!src || !tgt) return null;

            const x1 = src.x + src.w;
            const y1 = src.y + src.h / 2;
            const x2 = tgt.x;
            const y2 = tgt.y + tgt.h / 2;
            const dx = Math.max(36, Math.abs(x2 - x1) * 0.45);
            const d =
              src.column === tgt.column
                ? `M ${src.x + src.w / 2} ${src.y + src.h} C ${src.x + src.w / 2 + 24} ${(src.y + tgt.y) / 2}, ${tgt.x + tgt.w / 2 + 24} ${(src.y + tgt.y) / 2}, ${tgt.x + tgt.w / 2} ${tgt.y}`
                : `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const style = getEdgeStyle(edge.relation, isLight);
            const dimmed = highlightedSet && (!highlightedSet.has(edge.source) || !highlightedSet.has(edge.target));

            return (
              <path
                key={`${edge.source}-${edge.target}-${idx}`}
                d={d}
                fill="none"
                stroke={style.stroke}
                strokeWidth={dimmed ? 1 : 1.75}
                strokeDasharray={style.dash}
                opacity={dimmed ? 0.2 : 0.9}
              />
            );
          })}

          {/* Nodes */}
          {layout.positioned.map((node) => {
            const pal = getNodePalette(node, isLight);
            const isActive =
              selectedNodeId === node.id ||
              (activeEvidenceId !== null && (node.id === activeEvidenceId || node.evidenceRef === activeEvidenceId));
            const dimmed = highlightedSet && !highlightedSet.has(node.id);
            const truncated = node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                opacity={dimmed ? 0.3 : 1}
                className="cursor-pointer"
                onClick={() => {
                  const next = selectedNodeId === node.id ? null : node.id;
                  setSelectedNodeId(next);
                  if (next && (node.evidenceRef || node.type === 'evidence')) {
                    onSelectEvidence(node.evidenceRef || node.id);
                  }
                }}
              >
                <rect
                  width={node.w}
                  height={node.h}
                  rx={4}
                  fill={pal.bg}
                  stroke={pal.stroke}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text
                  x={10}
                  y={19}
                  fontSize={9.5}
                  fontFamily="var(--font-jetbrains)"
                  fill={pal.tag}
                >
                  {node.id} · {node.type.replace('_', ' ')}
                </text>
                <text
                  x={10}
                  y={38}
                  fontSize={11.5}
                  fontWeight={600}
                  fontFamily="var(--font-jakarta)"
                  fill={pal.text}
                >
                  {truncated}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedNode && (
        <div
          className="px-4 py-3 border-t text-xs"
          style={{
            borderColor: 'var(--arena-border)',
            backgroundColor: 'var(--arena-surface)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold" style={{ color: 'var(--arena-ink)' }}>
              {selectedNode.label}
            </span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--arena-accent)' }}>
              {selectedNode.id}
            </span>
          </div>
          {selectedNode.detail && (
            <p className="mt-1 leading-relaxed" style={{ color: 'var(--arena-muted)' }}>
              {selectedNode.detail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
