/**
 * A special token that can be returned from component hooks to signify that the
 * event listeners for the corresponding event should not be called.
 *
 * For example, if we returned this value from the `onLoad()` hook on a
 * `Component`, then the `load` event would not be emitted for that component.
 */
export const suppressEventListenersToken: unique symbol = Symbol('SUPPRESS_EVENT_LISTENERS');

/**
 * The type of the `suppressEventListenersToken`.
 */
export type SuppressEventListenersToken = typeof suppressEventListenersToken;
