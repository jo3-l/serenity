import type { ClientOptions, UserResolvable } from 'discord.js';
import { Client } from 'discord.js';

/**
 * The Serenity client.
 */
export class SerenityClient extends Client {
	/**
	 * A set of owner IDs.
	 */
	public readonly ownerIds: Set<string>;

	/**
	 * Creates a new SerenityClient.
	 *
	 * @param options - Options for the client.
	 */
	public constructor({ ownerIds, ...options }: SerenityClientOptions) {
		super(options);

		this.ownerIds = new Set(ownerIds);
	}

	/**
	 * Checks whether a user is an owner of this bot.
	 *
	 * @param user - User to check.
	 * @returns Whether the user is an owner of this bot.
	 */
	public isOwner(user: UserResolvable) {
		const userId = this.users.resolveID(user);
		if (!userId) return false;
		return this.ownerIds.has(userId);
	}
}

/**
 * Options for the `SerenityClient.`
 */
export interface SerenityClientOptions extends ClientOptions {
	/**
	 * An iterable of owner IDs.
	 */
	ownerIds: Iterable<string>;
}
