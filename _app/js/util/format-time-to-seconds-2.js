/**
 * formatTimeToSeconds takes a number of seconds and returns a string in the format of minutes:seconds.
 * Firstly it converts seconds to minutes such as util function @see formatSecondsToTime. Seconds is formatted to 0 decimals with toFixed(). If minutes and/or seconds has the length of 1 it ads a 0 before with padStart().
 * @param {number} totalSeconds - The number of seconds to be formatted
 * @returns {string} - A string in the format of minutes:seconds
 * @example
 * formatTimeToSeconds(125) // returns '02:05'
 */
export default function formatTimeToSeconds(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const formattedMinutes = minutes.toString().padStart(2, '0');
	const formattedSeconds = seconds.toFixed().toString().padStart(2, '0')

	return `${formattedMinutes}:${formattedSeconds}`;
}