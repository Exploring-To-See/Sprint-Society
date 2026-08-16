/**
 * Cross-cutting "a run is being recorded" flag. The hardware back handler and
 * the app chrome consult it so nothing can silently navigate away and unmount
 * an active tracker (which would discard the run without a word).
 */
export const runState = { active: false };
