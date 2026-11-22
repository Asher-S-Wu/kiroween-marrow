# From input to dossier

## Application boundary

The incident and manuscript applications supply distinct personas, sample inputs, themes, Zod verdict schemas and Markdown formatters through `DomainSpec`. The shared workbench and route factory consume that contract. The two configurations live in separate source folders. [Postmortem Court](../../../src/apps/postmortem-court) · [Defense Tribunal](../../../src/apps/defense-tribunal) · [Domain contract](../../../src/skeleton/schema/domain.ts)

## Session lifecycle

1. The browser posts the title and source text to the arena's session endpoint. The route validates the input and uses the arena's slicing strategy to number up to twelve evidence items. The initial MongoDB record contains the supplied text and those items. [Route factory](../../../src/skeleton/api/create-handlers.ts) · [Slicer](../../../src/skeleton/engine/slicer.ts)
2. The workbench opens the session's event stream. Each opening examiner receives the same docket and its own instruction. Each examiner in round two sees the opening transcript and challenges the next seat's position. Completed turns retain the cited IDs found in the docket. [Orchestrator](../../../src/skeleton/engine/orchestrator.ts) · [Prompts](../../../src/skeleton/engine/prompt-builder.ts)
3. The arbiter receives all six turns. Its JSON response must match the graph schema and the arena-specific verdict schema. Edges with missing endpoint nodes are discarded. The shared UI renders that graph alongside the arena's verdict component. [Session types](../../../src/skeleton/schema/session.ts) · [Graph view](../../../src/skeleton/ui/evidence-graph.tsx)
4. MongoDB stores the verdict, graph and transcript. Opening the saved URL loads the result. Export uses the arena's formatter to generate an incident postmortem or an editorial letter from that same session. [Session storage](../../../src/skeleton/storage/session-repo.ts) · [Workbench](../../../src/skeleton/ui/tribunal-workbench.tsx)

## Reading a result

The server checks that the arbiter supplied the expected fields. Scores, causal explanations and editorial recommendations are model judgments. Readers can select the underlying source material to check each interpretation. A dossier omitted from the public archive remains accessible to a person with its direct URL.
