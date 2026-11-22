# Marrow

## Elevator pitch

Marrow puts a conclusion on trial. Trace a checkout outage to a line of code or a paper's claim to a missing experiment, using two applications built on one evidence-review engine.

## Project story

During an outage, a graph that spikes at the right time can make a convincing suspect. In a research paper, a result can look just as convincing when the proposed method got three times as much computing power as its baseline. In both cases, the useful question is the same. Which piece of evidence would change our minds?

**Postmortem Court** seats three examiners around an incident timeline. In the checkout example, the deploy diff contains an early return. One examiner traces it to a database connection left open. A second asks what can actually be concluded about payments. The resulting postmortem separates the likely trigger from the retry traffic that made the outage worse. Readers can follow a citation back to the source.

**Defense Tribunal** seats reviewers of methodology, novelty and statistics around a manuscript. In the sample paper, the proposed search method gets extra reranking passes. The decision letter turns that objection into an experiment the authors can run with matched compute. Authors can export the letter, cited passages and revision checklist together.

The shared engine numbers the evidence, streams three independent opening opinions, then asks each examiner to challenge a colleague. An arbiter returns a graph and a verdict. Each application defines the meaning and format of that verdict. MongoDB stores the dossier so another reader can revisit the reasoning. A citation lets a reader check a model's interpretation against the original input.

## How I used Kiro

I built Marrow with Kiro, including the shared deliberation engine, Postmortem Court and Defense Tribunal. I added the repository's Kiro files after the initial implementation. The core specification records the behavior of the working applications and gives reviewers concrete ways to verify it. [Deliberation spec](../.kiro/specs/evidence-deliberation)

For a later change, I used Kiro CLI to specify how model preferences should behave when a visitor opens a second arena in the same tab. The server has to render a default view before it can read browser storage. Saving a model must also update the workbench immediately. Kiro drafted the requirements and design, then implemented a React store subscription and typed the application registry. The shared change serves both arenas. [Preference spec](../.kiro/specs/tab-model-preferences) · [Shared workbench](../src/skeleton/ui/tribunal-workbench.tsx)

The steering files describe what belongs in the shared engine and what each application owns. The Kiro IDE hook runs the project's TypeScript check when an arena contract or shared schema is edited. A change to a verdict shape can then be checked against the components that render and export it. [Steering](../.kiro/steering) · [Hook](../.kiro/hooks/check-shared-contracts.kiro.hook)

## Judge walkthrough

1. Open Postmortem Court with the prefilled checkout incident and choose **Convene Postmortem Court**. Follow a citation to its exhibit, inspect a graph node and choose **Export .md**. The completed example is available for immediate inspection. [Live app](https://marrow-web-production.up.railway.app/court) · [Recorded case](https://marrow-web-production.up.railway.app/court/court_09c140ba)
2. Open Defense Tribunal with the prefilled adaptive search paper and choose **Convene Defense Panel**. Read the objection about the compute budget, inspect the requested experiment and export the decision letter. [Live app](https://marrow-web-production.up.railway.app/defense) · [Recorded review](https://marrow-web-production.up.railway.app/defense/def_76c46c6b)
3. Compare the two app folders to see which parts of the implementation change between the incident and manuscript reviews. The hosted examples run in a desktop browser with the server's model configuration. [Postmortem Court](../src/apps/postmortem-court) · [Defense Tribunal](../src/apps/defense-tribunal) · [Shared engine](../src/skeleton/engine)

## Devpost fields

| Field | Entry |
| --- | --- |
| Project name | Marrow |
| Main category | Skeleton Crew |
| Built with | Kiro, TypeScript, React, Next.js, Node.js, MongoDB, Zod, OpenRouter, Railway |
| Public repository | [Asher-S-Wu/kiroween-marrow](https://github.com/Asher-S-Wu/kiroween-marrow) |
| Working applications | [Postmortem Court](https://marrow-web-production.up.railway.app/court) and [Defense Tribunal](https://marrow-web-production.up.railway.app/defense) |
| Judge access | Open either link in a desktop browser. No account or personal API key is required. |
| YouTube video | Add the public watch URL after uploading the English demo. |
| Project image | [Marrow cover, 1600 × 900](../public/images/marrow-og.png) |

## Video upload

Use **Marrow | One review engine, two applications | Kiroween 2026** as the video title. The 87-second desktop recording follows the same two cases linked above. It includes English narration and a selectable English caption track. A separate subtitle file is ready for YouTube Studio. [English subtitles](Marrow-English.srt)
