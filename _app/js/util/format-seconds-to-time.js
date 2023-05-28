/**
 * This function takes a total number of seconds and returns a string in the format of minutes and seconds.
 * The number of minutes is calculated by dividing seconds by 60 and only tak full minutes by rounding it down. The amount of seconds calculated by the reminder of total seconds. divided by 60 
 * @param {number} totalSeconds - The total number of seconds to be formatted
 * @returns {string} - A string in the format of minutes and seconds
 * @example
 * formatSecondsToTime(121) // returns "2min 1sec"
 */
export default function formatSecondsToTime(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return (`${minutes}min ${seconds}sec`);
}