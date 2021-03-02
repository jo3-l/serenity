import type { ActivitySet } from '#lib/setup/config/schemas';
import { ActivityRotation } from '#structures/ActivityRotation';
import { Time } from '#utils/time/constants';

import { LocalTime } from '@js-joda/core';
import type { Client } from 'discord.js';

const activitySets: ActivitySet[] = [
	{
		startTime: LocalTime.of(0, 0),
		endTime: LocalTime.of(2, 0),
		activities: [
			{ name: 'v1.2.3', type: 'PLAYING' },
			{ name: 'the world', type: 'WATCHING' },
		],
	},
	{
		startTime: LocalTime.of(2, 1),
		endTime: LocalTime.of(3, 0),
		activities: [
			{ name: 'Netflix', type: 'WATCHING' },
			{ name: 'Spotify', type: 'LISTENING' },
		],
	},
	{
		startTime: LocalTime.of(4, 31),
		endTime: LocalTime.of(23, 59),
		activities: [
			{ name: 'you', type: 'WATCHING' },
			{ name: 'with reality', type: 'PLAYING' },
		],
	},
];

const setActivityMock = jest.fn(() => Promise.resolve());

jest.useFakeTimers();
const clientMock = {
	user: { setActivity: setActivityMock },
	setInterval: setInterval as jest.MockedFunction<typeof setInterval>,
	clearInterval: clearInterval as jest.MockedFunction<typeof clearInterval>,
};

const activityRotation = new ActivityRotation((clientMock as unknown) as Client, {
	activitySets: activitySets,
	activityRotationInterval: 30 * Time.Minute,
});

function setLocalTime(hour: number, minute: number) {
	jest.spyOn(LocalTime, 'now').mockImplementation(() => LocalTime.of(hour, minute));
}

beforeEach(() => {
	jest.useFakeTimers();
	activityRotation.stop();

	setActivityMock.mockClear();
	clientMock.setInterval.mockClear();
	clientMock.clearInterval.mockClear();
});

describe('ActivityRotation#start()', () => {
	it('should set an interval', () => {
		activityRotation.start();

		expect(clientMock.setInterval).toHaveBeenCalledTimes(1);
	});

	it('should only set the interval once if called twice', () => {
		activityRotation.start();
		activityRotation.start();

		expect(clientMock.setInterval).toHaveBeenCalled();
	});

	it('should set the first activity immediately', () => {
		setLocalTime(0, 3);
		activityRotation.start();

		expect(setActivityMock).toHaveBeenCalled();
	});

	describe('sets activities correctly', () => {
		it('should use the correct set of activities for a given time', () => {
			setLocalTime(5, 38);
			activityRotation.start();

			expect(setActivityMock).toHaveBeenLastCalledWith(activitySets[2].activities[0]);
		});

		it('should clear the activity if no set matched the given time', () => {
			setLocalTime(3, 51);
			activityRotation.start();

			expect(setActivityMock).toHaveBeenLastCalledWith(undefined);
		});

		it('should be inclusive on the start time', () => {
			setLocalTime(0, 0);
			activityRotation.start();

			expect(setActivityMock).toHaveBeenLastCalledWith(activitySets[0].activities[0]);
		});

		it('should be inclusive on the end time', () => {
			setLocalTime(23, 59);
			activityRotation.start();

			expect(setActivityMock).toHaveBeenLastCalledWith(activitySets[2].activities[0]);
		});

		it('should loop through the set of activities in order and wrap around when necessary', () => {
			setLocalTime(2, 1);
			activityRotation.start();

			expect(setActivityMock).toHaveBeenCalledTimes(1);
			expect(setActivityMock).toHaveBeenLastCalledWith(activitySets[1].activities[0]);

			jest.advanceTimersToNextTimer();
			expect(setActivityMock).toHaveBeenCalledTimes(2);
			expect(setActivityMock).toHaveBeenLastCalledWith(activitySets[1].activities[1]);

			jest.advanceTimersToNextTimer();
			expect(setActivityMock).toHaveBeenCalledTimes(3);
			expect(setActivityMock).toHaveBeenLastCalledWith(activitySets[1].activities[0]);
		});
	});
});

describe('ActivityRotation#stop()', () => {
	it('should clear the interval', () => {
		activityRotation.start();
		activityRotation.stop();

		expect(clientMock.clearInterval).toHaveBeenCalledTimes(1);
	});

	it('should only clear the interval once if called twice', () => {
		activityRotation.start();
		activityRotation.stop();
		activityRotation.stop();

		expect(clientMock.clearInterval).toHaveBeenCalledTimes(1);
	});
});

describe('ActivityRotation#isRunning', () => {
	it('should be false by default', () => {
		expect(activityRotation.isRunning).toBeFalsy();
	});

	it('should be true when running', () => {
		activityRotation.start();
		expect(activityRotation.isRunning).toBeTruthy();
	});

	it('should be false after starting and stopping', () => {
		activityRotation.start();
		activityRotation.stop();

		expect(activityRotation.isRunning).toBeFalsy();
	});
});
