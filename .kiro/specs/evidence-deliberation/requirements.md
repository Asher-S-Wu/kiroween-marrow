# Evidence deliberation

Reconstructed with Kiro CLI on 2026-11-23 from the two applications built with Kiro during Kiroween. This specification describes the behavior a reviewer can observe today.

| Requirement | Acceptance condition |
| --- | --- |
| R1. Review the same kind of evidence consistently | Postmortem Court groups nonempty log and diff lines into exhibits. Defense Tribunal divides manuscript text into passages. Each item receives a stable ID within the case, beginning with `E1`. |
| R2. Give readers the reasoning as it happens | Submitting a preset opens a dossier. Three examiners give opening opinions and then challenge a colleague's opinion. The browser streams their text and shows the source associated with a selected citation. |
| R3. Produce a result useful in the reader's field | The incident verdict includes severity, ranked causes, evidence references, mitigations and prevention. The editorial letter includes a decision, blocking flaws, required experiments, strengths and a rebuttal checklist. |
| R4. Make conclusions inspectable | The graph connects findings to evidence and proposed actions. A reader can select a node and inspect its detail. Schema validation checks the shape of a verdict. The reader can assess whether its conclusions follow from the input. |
| R5. Make a completed review reusable | Reopening a completed dossier displays its stored results. A Markdown download includes the domain verdict, original exhibits or passages and the deliberation transcript. Only completed dossiers marked public appear in the archive. |

The judge walkthrough exercises all five requirements against two synthetic examples. [Steps and saved dossiers](../../../submission/devpost.md)
