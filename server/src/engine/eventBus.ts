import { EventEmitter } from 'events';

export interface RunCompletedPayload {
  userId: number;
  activityId: number;
  distanceMeters: number;
  movingTimeSeconds: number;
  pacePerKm: number;
  elevationGain: number | null;
  rpe: number | null;
}

export interface CascadeResult {
  xp: { awarded: number; total: number; level: number; leveledUp: boolean; previousLevel: number };
  kendu: { awarded: number; breakdown: any; balance: number; capped: boolean; streak: number };
  achievements: { unlocked: Array<{ id: number; name: string; icon: string; xpReward: number }> };
  notifications: { created: number };
  streak: { current: number; longest: number; extended: boolean };
  personalBest: { isPB: boolean; type: string | null; previousBest: number | null };
  validation: { suspicious: boolean; flags: string[]; confidence: number };
}

type EventMap = {
  RUN_COMPLETED: RunCompletedPayload;
};

class AppEventBus extends EventEmitter {
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void): this {
    return super.on(event, listener);
  }
}

export const eventBus = new AppEventBus();
