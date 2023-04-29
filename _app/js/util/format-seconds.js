export default function formatSeconds(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return (`${minutes}min ${seconds}sec`);
}