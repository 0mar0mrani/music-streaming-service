export default function player(releases) {
	let que = [];
	let queIndex = null;
	let currentTrack = null; 
	let currentRelease = null;
	let isPlaying = false;
	const audio = new Audio();

	const playerElement = document.querySelector('.player');

	const titleElement = document.querySelector('.player__title');
	const artistElement = document.querySelector('.player__artist');
	const artworkElement = document.querySelector('.player__artwork img');

	const playButton = document.querySelector('.player__play');
	const playButtonIcon = document.querySelector('.player__play img');

	playButton.addEventListener('click', handlePlayButtonClick);

	function handlePlayButtonClick() {
		toggleIsPlaying();
		renderAudio();
		renderHTML();
	}

	function setCurrentTrack(clickedTrackNumber) {
		queIndex = Number(clickedTrackNumber);
	}

	function setCurrentRelease(clickedReleaseNumber) {
		currentRelease = Number(clickedReleaseNumber);
	}

	function setQue() {
		que = [...releases[0].tracks];
		console.log(que);
	}

	function loadTrackFromQue() {
		currentTrack = que[queIndex];
		audio.src = currentTrack.trackURL;
	}

	function toggleIsPlaying(boolean) {
		if (!boolean) {
			isPlaying = !isPlaying;
		} else {
			isPlaying = boolean;
		}
	}

	function renderAudio() {
		isPlaying ? audio.play() : audio.pause();
   }

	function renderHTML() {
		if (isPlaying) {
			playerElement.classList.add('player--open');
			titleElement.innerText = currentTrack.title;
			artistElement.innerText = currentTrack.artists.join(', ');
			artworkElement.src = currentTrack.artworkURL;
		}

		renderPlayButton();

		function renderPlayButton() {
			const icon = isPlaying ? '_app/assets/svg/pause.svg' : '_app/assets/svg/play.svg'
			playButtonIcon.src = icon;
		}
	}

	return {
		setCurrentTrack,
		setCurrentRelease,
		setQue,
		loadTrackFromQue,
		toggleIsPlaying,
		renderAudio,
		renderHTML,
	}
}