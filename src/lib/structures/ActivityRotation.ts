import type { ActivitySet } from '#lib/setup/config/schemas';
import { autobind } from '#utils/decorators';
import { logger } from '#utils/logger';
import { Time } from '#utils/time/constants';

import { LocalTime, ZoneOffset } from '@js-joda/core';
import type { Client } from 'discord.js';

export class ActivityRotation {
	private readonly activitySets: ActivitySet[];
	private readonly activityRotationInterval: number;
	private timer?: NodeJS.Timer;
	// Index of the last activity set used.
	private lastSetIndex = -1;
	// Index of the last activity rotated through in the activity set.
	private rotationIndex = -1;
	private _isRunning = false;

	/**
	 * Creates a new ActivityRotation.
	 *
	 * @remarks
	 * The instance created will be paused by default.
	 *
	 * @param client - Client to use.
	 * @param options - Options for the ActivityRotation.
	 */
	public constructor(
		private readonly client: Client,
		{ activitySets, activityRotationInterval = 5 * Time.Minute }: ActivityRotationOptions,
	) {
		this.activitySets = activitySets;
		this.activityRotationInterval = activityRotationInterval;
	}

	/**
	 * Whether this activity rotation is currently running.
	 */
	public get isRunning() {
		return this._isRunning;
	}

	/**
	 * Starts this activity rotation, which will immediately poll the next
	 * activity and set it.
	 *
	 * @remarks
	 * This method is idempotent and is thus safe to call even if the activity
	 * rotation is already running.
	 */
	public start() {
		if (this._isRunning) return;
		this._isRunning = true;
		this.setNextActivity();
		this.timer = this.client.setInterval(this.setNextActivity, this.activityRotationInterval);
	}

	/**
	 * Stops this activity rotation, causing new activities to no longer be polled.
	 *
	 * @remarks
	 * This method is idempotent and is thus safe to call even if the activity
	 * rotation is already not running.
	 */
	public stop() {
		if (!this._isRunning) return;
		this._isRunning = false;
		this.client.clearInterval(this.timer!);
		this.timer = undefined;
	}

	@autobind
	private setNextActivity() {
		const activity = this.getNextActivity();
		void this.client
			.user!.setActivity(activity)
			.then(() => logger.info('Set next activity in activity rotation'))
			.catch(
				/* istanbul ignore next */ (error) => logger.error(error, 'Failed setting next activity for activity rotation'),
			);
	}

	private getNextActivity() {
		const now = LocalTime.now(ZoneOffset.UTC);
		const setIndex = this.activitySets.findIndex((entry) => {
			return now.compareTo(entry.startTime) >= 0 && now.compareTo(entry.endTime) <= 0;
		});
		if (setIndex === -1) return;

		const activitySet = this.activitySets[setIndex];
		if (setIndex === this.lastSetIndex) {
			++this.rotationIndex;
			// Wrap the rotation index back around to the start if we're past the last element.
			if (this.rotationIndex === activitySet.activities.length) this.rotationIndex = 0;

			return activitySet.activities[this.rotationIndex];
		}

		this.lastSetIndex = setIndex;
		this.rotationIndex = 0;
		return activitySet.activities[0];
	}
}

/**
 * Options for an ActivityRotation.
 */
export interface ActivityRotationOptions {
	/**
	 * Sets of activities for the activity rotation.
	 *
	 * @remarks
	 * An set of activities is a list of activities to rotate through in order
	 * in a given period of time in a day.
	 */
	activitySets: ActivitySet[];

	/**
	 * Interval at which new activities will be polled and the status updated in
	 * milliseconds.
	 *
	 * @default 300_000 // 5 minutes
	 */
	activityRotationInterval?: number;
}
