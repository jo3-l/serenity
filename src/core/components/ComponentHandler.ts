import type { SerenityClient } from '#core/SerenityClient';
import type { Constructor } from '#lib/types/shared';
import { isThenable } from '#utils/predicates';

import type { Component } from './Component';
import type { LoaderStrategy } from './strategies/LoaderStrategy';
import { suppressEventListenersToken } from './tokens';

import { Collection, Constants } from 'discord.js';
import { EventEmitter } from 'events';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * Abstract class for loading and executing components.
 */
export abstract class ComponentHandler<
	TComponent extends Component,
	TEvents extends {
		[K in keyof TEvents]: K extends ComponentHandlerEvent ? ComponentHandlerEventTypes[K] : TEvents[K];
	} = ComponentHandlerEventTypes<TComponent>
> extends EventEmitter {
	// Override certain methods inherited from the `EventEmitter` so we have
	// more accurate types.
	public readonly addListener!: EventEmitterFn<this, TEvents>;
	public readonly prependOnceListener!: EventEmitterFn<this, TEvents>;
	public readonly prependListener!: EventEmitterFn<this, TEvents>;
	public readonly removeListener!: EventEmitterFn<this, TEvents>;
	public readonly emit!: <K extends string | symbol>(
		event: K,
		...args: EventListenerParameters<K, TComponent, TEvents>
	) => boolean;

	public readonly on!: EventEmitterFn<this, TEvents>;
	public readonly once!: EventEmitterFn<this, TEvents>;
	public readonly off!: EventEmitterFn<this, TEvents>;

	/**
	 * A collection of loaded components, keyed by ID.
	 */
	public readonly components = new Collection<string, TComponent>();

	/**
	 * Class type that all loaded components should be instances of.
	 */
	public readonly classType: Constructor<TComponent>;

	/**
	 * The loader strategy to use.
	 */
	public readonly loaderStrategy: LoaderStrategy<TComponent>;

	/**
	 * The client that constructed this handler.
	 */
	public readonly client: SerenityClient;

	/**
	 * Creates a new `ComponentHandler`.
	 *
	 * @param client - The client instance.
	 * @param options - Options for the handler.
	 */
	public constructor(client: SerenityClient, { classType, loaderStrategy }: ComponentHandlerOptions<TComponent>) {
		super();

		this.client = client;
		this.classType = classType;
		this.loaderStrategy = loaderStrategy;

		this.client.once(Constants.Events.CLIENT_READY, () => void this.initializeAll());
	}

	/**
	 * Loads all components recursively from the given directory.
	 *
	 * @param directory - Directory to find components in.
	 * @returns A promise resolving to the component handler.
	 */
	public async loadAll(directory: string) {
		const promises = [];
		for await (const filepath of this.walkDirectory(directory)) {
			if (this.loaderStrategy.filter(filepath)) continue;

			let value = this.loaderStrategy.load(filepath);
			if (isThenable(value)) value = await value;

			for (const component of this.loaderStrategy.resolve(this, value)) {
				const instance: TComponent = Reflect.construct(component, []);
				promises.push(this.load(instance, filepath));
			}
		}

		await Promise.all(promises);

		return this;
	}

	/**
	 * Loads a component.
	 *
	 * @param component - Component to load.
	 * @param filepath - Filepath of the component.
	 * @param isReload - Whether this is a reload. Defaults to false.
	 * @returns A promise resolving to the loaded component.
	 */
	public async load(component: TComponent, filepath: string, isReload = false) {
		if (this.components.has(component.id)) throw new Error(`Component '${component.id}' is already loaded.`);
		if (!component.enabled) return component;

		component.client = this.client;
		component.handler = this;
		component.filepath = filepath;

		this.components.set(component.id, component);
		this.register?.(component);

		let result = component.onLoad?.(isReload);
		if (isThenable(result)) result = await result;
		if (result !== suppressEventListenersToken) this.emit(ComponentHandlerEvents.Load, component, isReload);

		return component;
	}

	/**
	 * Unloads all components.
	 *
	 * @returns A promise resolving to the component handler.
	 */
	public async unloadAll() {
		const promises = this.components.map((component) => component.unload());
		await Promise.all(promises);
		return this;
	}

	/**
	 * Unloads a component.
	 *
	 * @param component - Component to unload.
	 * @returns A promise resolving to the unloaded component.
	 */
	public async unload(component: TComponent) {
		this.loaderStrategy.unload?.(component.filepath);
		this.components.delete(component.id);
		this.unregister?.(component);

		let result = component.onUnload?.();
		if (isThenable(result)) result = await result;
		if (result !== suppressEventListenersToken) this.emit(ComponentHandlerEvents.Unload, component);

		return component;
	}

	/**
	 * Reloads all components.
	 *
	 * @returns A promise resolving to the component handler.
	 */
	public async reloadAll() {
		const promises = this.components.map((component) => this.reload(component));
		await Promise.all(promises);
		return this;
	}

	/**
	 * Reloads a component.
	 *
	 * @param component - Component to reload.
	 * @returns A promise resolving to the reloaded component.
	 */
	public async reload(component: TComponent) {
		this.loaderStrategy.unload?.(component.filepath);
		this.unregister?.(component);

		const reloadedComponent = await this.load(component, component.filepath, true);
		return reloadedComponent;
	}

	/**
	 * Initializes all components. This is automatically called once the client
	 * is ready.
	 */
	public async initializeAll() {
		const promises = this.components.map(async (component) => {
			await component.init?.();
			this.emit(ComponentHandlerEvents.Init, component);
		});

		await Promise.all(promises);
		this.emit(ComponentHandlerEvents.AllInitialized);
	}

	private async *walkDirectory(directory: string): AsyncIterableIterator<string> {
		const dirents = await readdir(directory, { withFileTypes: true });
		for (const dirent of dirents) {
			const filepath = join(directory, dirent.name);

			if (dirent.isDirectory()) yield* this.walkDirectory(filepath);
			else yield filepath;
		}
	}
}

export interface ComponentHandler<
	TComponent extends Component,
	TEvents extends {
		[K in keyof TEvents]: K extends ComponentHandlerEvent ? ComponentHandlerEventTypes[K] : TEvents[K];
	} = ComponentHandlerEventTypes<TComponent>
> {
	/**
	 * Registers a component. This can be used to perform any additional set-up
	 * before the component is fully loaded.
	 *
	 * @param component - Component to register.
	 */
	register?(component: TComponent): void;

	/**
	 * Unregisters a component. This can be used to perform any additional
	 * clean-up before the component is fully unloaded.
	 *
	 * @param component - Component to unregister.
	 */
	unregister?(component: TComponent): void;
}

/**
 * Options for a `ComponentHandler`.
 */
export interface ComponentHandlerOptions<T extends Component = Component> {
	/**
	 * Class type that all loaded components should be instances of.
	 */
	classType: Constructor<T>;

	/**
	 * Loader strategy to use.
	 */
	loaderStrategy: LoaderStrategy<T>;
}

/**
 * Events emitted by the `ComponentHandler`.
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ComponentHandlerEvents = {
	Load: 'load',
	Unload: 'unload',
	Init: 'init',
	AllInitialized: 'allInitialized',
} as const;

/**
 * Represents an event name emitted by the `ComponentHandler`.
 */
export type ComponentHandlerEvent = typeof ComponentHandlerEvents[keyof typeof ComponentHandlerEvents];

/**
 * Types of events emitted by the `ComponentHandler`.
 */
export interface ComponentHandlerEventTypes<T extends Component = Component> {
	[ComponentHandlerEvents.Load]: [component: T, isReload: boolean];
	[ComponentHandlerEvents.Unload]: [component: T];
	[ComponentHandlerEvents.Init]: [component: T];
	[ComponentHandlerEvents.AllInitialized]: [];
}

type EventEmitterFn<
	THandler extends ComponentHandler<Component>,
	TEvents extends {
		[K in keyof TEvents]: any[];
	}
> = <K extends string | symbol>(
	event: K,
	listener: (
		...args: EventListenerParameters<K, THandler extends ComponentHandler<infer TModule> ? TModule : Component, TEvents>
	) => void,
) => THandler;

type EventListenerParameters<
	TKey extends string | symbol,
	TComponent extends Component,
	TEvents extends {
		[K in keyof TEvents]: any[];
	}
> = TKey extends ComponentHandlerEvent
	? ComponentHandlerEventTypes<TComponent>[TKey]
	: TKey extends keyof TEvents
	? TEvents[TKey]
	: any[];
