import type { ComponentHandlerEventTypes, ComponentHandlerOptions } from '#core/components/ComponentHandler';
import { ComponentHandler, ComponentHandlerEvents } from '#core/components/ComponentHandler';
import { suppressEventListenersToken } from '#core/components/tokens';
import type { SerenityClient } from '#core/SerenityClient';
import type { MakeOptional } from '#lib/types/shared';
import { isThenable } from '#utils/predicates';

import { Listener } from './Listener';

import type { ClientEvents } from 'discord.js';
import type { EventEmitter } from 'events';

/**
 * Loads listeners and registers them with EventEmitters.
 */
export class ListenerHandler extends ComponentHandler<Listener, ListenerHandlerEventTypes> {
	private readonly emitters = new Map<BuiltInEmitter, EventEmitter>();
	private readonly wrappedExecuteFunctions = new WeakMap<Listener, (...args: unknown[]) => unknown>();

	/**
	 * Creates a new `ListenerHandler`.
	 *
	 * @remarks
	 * This will automatically register a built-in emitter named `client`.
	 *
	 * @param client - Client to use.
	 * @param options - Options for the listener handler.
	 */
	public constructor(
		client: SerenityClient,
		{ classType = Listener, ...options }: MakeOptional<ComponentHandlerOptions<Listener>, 'classType'>,
	) {
		super(client, { classType, ...options });

		this.emitters.set('client', client);
	}

	/**
	 * Registers built-in emitters with this listener handler.
	 *
	 * @param emitters - Emitters to register.
	 * @returns The listener handler.
	 */
	public registerEmitters(emitters: Record<BuiltInEmitter, EventEmitter>) {
		for (const [name, emitter] of Object.entries(emitters) as [BuiltInEmitter, EventEmitter][]) {
			this.emitters.set(name, emitter);
		}

		return this;
	}

	public register(listener: Listener) {
		const emitter = this.resolveEmitter(listener);

		const wrappedFunction = this.wrapExecuteFunction(listener);
		this.wrappedExecuteFunctions.set(listener, wrappedFunction);

		if (listener.once) emitter.once(listener.event, wrappedFunction);
		else emitter.on(listener.event, wrappedFunction);
	}

	public unregister(listener: Listener) {
		const emitter = this.resolveEmitter(listener);

		const wrappedFunction = this.wrappedExecuteFunctions.get(listener)!;
		emitter.off(listener.event, wrappedFunction);
		this.wrappedExecuteFunctions.delete(listener);
	}

	private resolveEmitter(listener: Listener) {
		const emitter = typeof listener.emitter === 'string' ? this.emitters.get(listener.emitter) : listener.emitter;
		if (!emitter) throw new Error(`The emitter for listener '${listener.id}' was not a valid EventEmitter.'`);
		return emitter;
	}

	private wrapExecuteFunction(listener: Listener) {
		return async (...args: unknown[]) => {
			try {
				await listener.execute(...args);
			} catch (error) {
				let result = listener.onError?.(error, ...args);
				if (isThenable(result)) result = await result;

				const didEmit =
					result === suppressEventListenersToken
						? false
						: this.emit(ListenerHandlerEvents.Error, listener, error, ...args);

				// If there was no listener listening for the `error` event & no
				// `onError` hook defined on the listener, throw the error.
				if (!didEmit && typeof listener.onError !== 'function') throw error;
			}
		};
	}
}

/**
 * Events emitted by the `ListenerHandler`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ListenerHandlerEvents = {
	...ComponentHandlerEvents,
	Error: 'error',
} as const;

/**
 * Represents an event name emitted by the `ListenerHandler`.
 */
export type ListenerHandlerEvent = typeof ListenerHandlerEvents[keyof typeof ListenerHandlerEvents];

/**
 * Types of events emitted by the `ListenerHandler`.
 */
export interface ListenerHandlerEventTypes extends ComponentHandlerEventTypes<Listener> {
	[ListenerHandlerEvents.Error]: [listener: Listener, error: Error, ...args: unknown[]];
}

/**
 * An interface where the keys represent names of built-in emitters and the
 * values is a union of all possible event names emitted by that event emitter.
 * It is designed to be used with [interface
 * merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
 */
export interface BuiltInEmitters {
	client: keyof ClientEvents;
}

/**
 * Represents the name of a built-in emitter.
 */
export type BuiltInEmitter = keyof BuiltInEmitters;
