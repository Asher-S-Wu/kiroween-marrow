import type { PresetCase } from '@/skeleton/schema/domain';

export const defenseTribunalPresets: PresetCase[] = [
  {
    id: 'adaptive-rag-compute-confound',
    label: 'AI Systems · Adaptive RAG',
    summary: 'Multi-hop QA accuracy claim confounded by 3x reranker passes & single seed',
    title: 'Adaptive Sparse-Dense Routing for Multi-Hop Question Answering',
    rawInput: `Abstract: We introduce HelixRoute, an adaptive query router that dynamically mixes BM25 sparse retrieval with dense bi-encoder passages for multi-hop question answering. Across HotpotQA and MuSiQue, HelixRoute achieves a +4.2 F1 improvement over strong single-pass dense retrieval baselines while claiming negligible architectural overhead.

Methodology (§3.2): When router entropy exceeds 0.35, HelixRoute triggers three sequential cross-encoder reranking passes (DeBERTa-v3-large, batch size 16) and invokes a 70B LLM query rewriter before final answer synthesis. Baseline models (Contriever and BGE-large) are evaluated in their standard single-pass configuration without query rewriting.

Experiments (§4.1): Due to API budget constraints, all comparisons are reported on a 1,200-question stratified sample of the validation split. Statistical significance (p < 0.01) is computed using a single-seed paired t-test across individual questions without controlling for multiple dataset comparisons.

Limitations (§5): Latency profiling was conducted exclusively on a dedicated A100-80GB node in FP16; end-to-end p95 latency increased from 180ms (baseline) to 1,940ms (HelixRoute), which we leave to future quantization work.`,
  },
  {
    id: 'biostat-biomarker-cohort',
    label: 'Biostatistics · Biomarker Trial',
    summary: 'Retrospective single-center cohort with post-hoc subgroup cutoff & data leakage',
    title: 'Early Sepsis Prediction from Routine Emergency Triage Panel via Gradient Boosting',
    rawInput: `Objective: We develop a gradient-boosted decision tree classifier to predict ICU sepsis onset 12 hours in advance using only standard emergency department blood panel metrics collected across 640 adult admissions at a single tertiary hospital between 2022 and 2025.

Feature Engineering & Normalization: Missing lactate and procalcitonin values (present in 38% of non-sepsis admissions) were imputed using k-nearest neighbors fit on the complete 640-patient matrix prior to 5-fold cross-validation. We additionally engineered a binary "clinician_lactate_ordered" indicator, which emerged as the top SHAP feature (importance 0.41).

Results: Our model achieved an AUROC of 0.91 (95% CI: 0.87-0.95) compared to qSOFA (AUROC 0.72). After inspecting ROC curves, we selected a post-hoc probability threshold of 0.37 on the combined validation folds, yielding 89% sensitivity and 84% specificity.

Conclusion: Because the input features require no additional laboratory hardware, the model is ready for immediate multi-hospital clinical deployment to reduce sepsis mortality.`,
  },
  {
    id: 'hci-ai-tutor-study',
    label: 'HCI · AI Coding Tutor Study',
    summary: 'Within-subject convenience study lacking novelty washout & retention test',
    title: 'Socratic Scaffolding in Agentic IDE Tutors Doubles Novice Debugging Speed',
    rawInput: `Introduction: We evaluate SocraticIDE, an AI debugging assistant that guides computer science undergraduates using structured hints rather than direct code patches. We hypothesize that Socratic scaffolding improves both debugging speed and long-term conceptual mastery.

Study Design: We recruited 24 undergraduate CS students from our own senior seminar via optional extra credit. In a single 45-minute lab session, every participant first solved Bug A using standard VS Code (control) and then solved Bug B using SocraticIDE (treatment). Task order was fixed to avoid onboarding confusion.

Findings: Participants completed Bug B in an average of 7.4 minutes versus 15.1 minutes on Bug A (51% reduction). Post-session self-reported Likert surveys showed 92% of students "felt they understood recursion and pointer lifecycles much more deeply" after using SocraticIDE.

Discussion: These findings establish that Socratic AI tutors double debugging efficiency while producing durable conceptual learning gains across undergraduate programming curricula.`,
  },
];
