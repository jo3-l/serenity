import type { SerenityClient } from '#core/SerenityClient';
import type { MaybePromise } from '#lib/types/shared';

import type { ComponentHandler } from './ComponentHandler';
import type { SuppressEventListenersToken } from './tokens';

/**
 * A single building block in a larger structure.
 */
export abstract class Component {
	/**
	 * A unique identifier for this component.
	 */
	public id: string;

	/**
	 * The client that constructed this component.
	 */
	public client!: SerenityClient;

	/**
	 * The handler that constructed this component.
	 */
	public handler!: ComponentHandler<Component>;

	/**
	 * The filepath of this component.
	 */
	public filepath!: string;

	/**
	 * Whether the component is enabled. If this is `false`, then the component
	 * will be unloaded immediately after it is registered.
	 *
	 * @default true
	 */
	public enabled: boolean;

	/**
	 * Creates a new component.
	 */
	public constructor(id: string, { enabled = false }: ComponentOptions = {}) {
		this.id = id;
		this.enabled = enabled;
	}

	/**
	 * Unloads this component.
	 *
	 * @returns A promise resolving to the component.
	 */
	public unload() {
		return this.handler.unload(this);
	}

	/**
	 * Reloads this component.
	 *
	 * @returns A promise resolving to the component.
	 */
	public reload() {
		return this.handler.reload(this);
	}
}

export interface Component {
	/**
	 * A hook that is called when the component is loaded. This corresponds to
	 * the `load` event on the `ComponentHandler`.
	 *
	 * @param isReload - Whether this is a reload.
	 */
	onLoad?(isReload: boolean): MaybePromise<SuppressEventListenersToken | void>;

	/**
	 * A hook that is called when the component is unloaded. This corresponds to
	 * the `unload` event on the `ComponentHandler`.
	 */
	onUnload?(): MaybePromise<SuppressEventListenersToken | void>;

	/**
	 * A method that is ran once for loaded components when the client is ready.
	 *
	 * @remarks
	 * This can be used for data initialization which depends on the client
	 * being ready.
	 */
	init?(): unknown;
}

/**
 * Options for a component.
 */
export interface ComponentOptions {
	/**
	 * Whether the component is enabled. If this is `false`, then the component
	 * will be unloaded immediately after it is registered.
	 *
	 * @default true
	 */
	enabled?: boolean;
}
