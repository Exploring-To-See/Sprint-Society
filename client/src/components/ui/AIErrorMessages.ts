export const AI_ERROR_MESSAGES = [
  "Coach fell asleep mid-sentence. Waking him up... 💤",
  "AI tripped over its shoelaces. Give it a sec.",
  "Even AI needs a water break. Try again in a moment.",
  "Coach is doing sprints in the cloud. Be right back.",
  "Our AI ran a bit too hard today. Catching its breath...",
  "The hamster powering our AI took a break. Hold on.",
  "AI went for a recovery run. Should be back shortly.",
  "Coach ghosted us. Don't worry, we'll find him.",
  "Plot twist: the AI hit a wall. Not the marathon kind.",
  "Looks like coach is stretching. Try again in 10 seconds.",
];

export function getRandomAIError(): string {
  return AI_ERROR_MESSAGES[Math.floor(Math.random() * AI_ERROR_MESSAGES.length)];
}
