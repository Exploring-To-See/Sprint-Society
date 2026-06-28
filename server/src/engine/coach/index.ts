// One-way (Rs.9) AI running coach — headless, deterministic engine.
//
// Ported from the Ishan-AI-Coach lab (see ai-coach/ at the repo root for the
// Python source, the RAG corpus, guardrails, and the eval harness). The engine
// here is pure TypeScript with no I/O: feed it telemetry + the user's pace zones
// and it returns persona-voiced, grounded coaching for before/during/after a run.
//
// Entry points: preRunBrief, runCueStream (or CuePlanner.evaluate per live tick),
// postRunReport. See ../../routes/coach.routes.ts for the HTTP surface.

export * from './runState';
export * from './runCues';
export * from './cueLibrary';
export * from './runAnalysis';
export * from './oneWayCoach';
