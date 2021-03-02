/**
 * An enumeration of commonly used units of time.
 */
export const enum Time {
	Millisecond = 1,
	Second = 1000 * Millisecond,
	Minute = 60 * Second,
	Hour = 60 * Minute,
	Day = 24 * Hour,
	Week = 7 * Day,
	Year = 365 * Day,
}
