// One-way (Rs.9) AI running coach — portable, headless, deterministic engine.
//
// This copy is imported by the React CLIENT (client/src/lib/coach) to run the live
// during-run cue engine ON-DEVICE (no network per GPS tick). The Express SERVER
// keeps an identical copy under server/src/engine/coach because its tsconfig
// `rootDir: ./src` forbids importing files outside server/src — keep the two in
// sync (both are mechanical ports of the canonical Python preserved on the
// `ai-coach-assets` branch).
//
// Pure TypeScript, no I/O: feed it telemetry + the user's pace zones and it returns
// persona-voiced, grounded coaching for before / during / after a run.

export * from './pace';
export * from './runState';
export * from './runCues';
export * from './cueLibrary';
export * from './runAnalysis';
export * from './oneWayCoach';
