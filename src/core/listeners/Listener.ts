import type { ComponentOptions } from '#core/components/Component';
import { Component } from '#core/components/Component';
import type { SuppressEventListenersToken } from '#core/components/tokens';
import type { Cast, MaybePromise } from '#lib/types/shared';

import type { BuiltInEmitter, BuiltInEmitters } from './ListenerHandler';

import type { EventEmitter } from 'events';

/**
 * Represents a listener.
 */
export abstract class Listener extends Component {
	/**
	 * The emitter this listener is attached to.
	 */
	public readonly emitter: EventEmitter | BuiltInEmitter;

	/**
	 * The name of the event being listened for.
	 */
	public readonly event: string | symbol;

	/**
	 * Whether this listener should attach itself using `once` rather than `on`.
	 *
	 * @default false
	 */
	public readonly once: boolean;

	/**
	 * Creates a new `Listener`.
	 *
	 * @param id - ID of this listener.
	 * @param options - Options for the listener.
	 */
	public constructor(id: string, { emitter, event, once = false, ...options }: ListenerOptions) {
		super(id, options);

		this.emitter = emitter;
		this.event = event;
		this.once = once;
	}

	/**
	 * Executes the listener.
	 *
	 * @param args - Arguments passed to the listener.
	 */
	public abstract execute(...args: unknown[]): unknown;
}

export interface Listener {
	/**
	 * A hook that is called when the listener errors. This corresponds to
	 * the `error` event on the `ListenerHandler`.
	 *
	 * @param error - The error thrown.
	 * @param args - Arguments passed to the listener.
	 */
	onError?(error: Error, ...args: unknown[]): MaybePromise<SuppressEventListenersToken | void>;
}

/**
 * Options for a listener.
 */
export type ListenerOptions = (
	| {
			[K in keyof BuiltInEmitters]: {
				emitter: K;
				event: Cast<BuiltInEmitters[K], string | symbol>;
				once?: boolean;
			};
	  }[keyof BuiltInEmitters]
	| {
			emitter: EventEmitter;
			event: string | symbol;
			once?: boolean;
	  }
) &
	ComponentOptions;
