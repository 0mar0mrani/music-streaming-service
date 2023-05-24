export default function formatTimeToSeconds(tracks) {
	const totalSeconds = tracks.reduce((accumulator, track) => {
		return accumulator + track.playTime.minutes * 60 + track.playTime.seconds
	}, 0)

	return totalSeconds;
}