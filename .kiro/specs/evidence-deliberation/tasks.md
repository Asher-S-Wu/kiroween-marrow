# Implementation and verification

- [x] Mount the incident and manuscript applications in separate folders using one shared domain contract (R1, R3).
- [x] Assign evidence IDs and stream the opening statements and cross-examinations (R1, R2).
- [x] Validate the arbiter output, render its graph and persist the domain verdict (R3, R4).
- [x] Reopen each saved dossier and export its arena-specific Markdown report (R5).

## Production checks on 2026-11-23

| Run | Observed |
| --- | --- |
| [Checkout incident](https://marrow-web-production.up.railway.app/court/court_09c140ba) | Six cited turns, evidence graph, ranked causes and a downloadable postmortem. The panel connected the early return in the checkout diff to the exhausted connection pool. |
| [Adaptive search paper](https://marrow-web-production.up.railway.app/defense/def_76c46c6b) | Six cited turns, evidence graph, decision letter and a downloadable rebuttal dossier. The panel asked for a compute-matched comparison. |

These saved examples record the outputs used in the demo. Fresh model runs can phrase the findings differently.
