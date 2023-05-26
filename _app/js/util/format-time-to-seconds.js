/**
 * This function takes an array of tracks and returns the total play time in seconds.
 * It iterates over tracks and reduce playtime to to second by using reduce method.
 * @param {object[]} tracks - An array of tracks
 * @returns {number} totalSeconds - The total play time in seconds
 * @example
 * const tracks = [
 *	{ playTime: { minutes: 3, seconds: 20 } },
 *	{ playTime: { minutes: 4, seconds: 10 } }
 * ]
 * formatTimeToSeconds(tracks) // returns 300;
 */
export default function formatTimeToSeconds(tracks) {
	const totalSeconds = tracks.reduce((accumulator, track) => {
		return accumulator + track.playTime.minutes * 60 + track.playTime.seconds
	}, 0)

	return totalSeconds;
}