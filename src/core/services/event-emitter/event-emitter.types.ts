/**
 * Event map for typed events.
 * Extend this interface in your module to get typed emit/on:
 *
 * @example
 * declare module "@/core/services/event-emitter/event-emitter.types" {
 *   interface AppEventMap {
 *     "user.created": { userId: string; email: string };
 *     "order.placed": { orderId: string; userId: string };
 *   }
 * }
 */
export interface AppEventMap {
  [event: string]: unknown;
}
