export default function formatTime(seconds) {
	seconds = seconds.toFixed(2); 
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	const formattedMinutes = minutes.toString().padStart(2, '0');
	const formattedSeconds = remainingSeconds.toFixed().toString().padStart(2, '0')

	return `${formattedMinutes}:${formattedSeconds}`;
}