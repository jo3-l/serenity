import { Time } from '#utils/time/constants';

import { LocalTime } from '@js-joda/core';
import type { Infer } from 'myzod';
import myzod from 'myzod';

export const activityOptionsSchema = myzod.object({
	name: myzod.string(),
	type: myzod.literals('PLAYING', 'WATCHING', 'LISTENING', 'STREAMING'),
	url: myzod
		.string()
		.pattern(/^https:\/\/twitch.tv\/\w{4,25}$/)
		.optional(),
});
export type ActivityOptions = Infer<typeof activityOptionsSchema>;

const timeOfDaySchema = myzod
	.string()
	.withPredicate((str) => {
		const matches = /^(\d{2}):(\d{2})$/.exec(str);
		if (!matches) return false;

		const hour = Number(matches[1]);
		const minute = Number(matches[2]);

		return hour < 24 && minute < 60;
	}, 'must be a valid time of day')
	.map(LocalTime.parse);

export const activitySetSchema = myzod.object({
	startTime: timeOfDaySchema,
	endTime: timeOfDaySchema,
	activities: myzod.array(activityOptionsSchema).min(1),
});
export type ActivitySet = Infer<typeof activitySetSchema>;

/* eslint-disable @typescript-eslint/naming-convention */
export const configSchema = myzod.object({
	production: myzod.boolean(),

	postgres_user: myzod.string(),
	postgres_password: myzod.string(),
	postgres_db: myzod.string(),
	postgres_host: myzod.string(),
	postgres_port: myzod.number().min(0),

	owner_ids: myzod.array(myzod.string()),
	prefixes: myzod.array(myzod.string()),
	nlp_prefixes: myzod.array(myzod.string()).default([]),
	discord_token: myzod.string(),

	activity_rotation: myzod.array(activitySetSchema).default([]),
	activity_rotation_interval: myzod
		.number()
		.min(0)
		.default(5 * Time.Minute),
});
/* eslint-enable @typescript-eslint/naming-convention */

export type Config = Infer<typeof configSchema>;
