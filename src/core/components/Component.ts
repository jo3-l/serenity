import type { SerenityClient } from '#core/SerenityClient';

import type { ComponentHandler } from './ComponentHandler';

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
	 * Creates a new component.
	 */
	public constructor(id: string) {
		this.id = id;
	}
}
