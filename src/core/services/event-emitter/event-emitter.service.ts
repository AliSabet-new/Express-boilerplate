import { EventEmitter } from "events";

import type { AppEventMap } from "@/core/services/event-emitter/event-emitter.types";

export type Listener<T = unknown> = (payload: T) => void | Promise<void>;

export class EventEmitterService {
  private readonly emitter: EventEmitter;

  constructor(maxListeners = 50) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(maxListeners);
  }

  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
    this.emitter.emit(event as string, payload);
  }

  on<K extends keyof AppEventMap>(event: K, listener: Listener<AppEventMap[K]>): void {
    this.emitter.on(event as string, listener as Listener);
  }

  once<K extends keyof AppEventMap>(event: K, listener: Listener<AppEventMap[K]>): void {
    this.emitter.once(event as string, listener as Listener);
  }

  off<K extends keyof AppEventMap>(event: K, listener: Listener<AppEventMap[K]>): void {
    this.emitter.off(event as string, listener as Listener);
  }

  removeAllListeners(event?: keyof AppEventMap): void {
    if (event !== undefined) {
      this.emitter.removeAllListeners(event as string);
    } else {
      this.emitter.removeAllListeners();
    }
  }
}

export const eventEmitterServiceInstance = new EventEmitterService();
