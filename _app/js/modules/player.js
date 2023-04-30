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

	const previousButton = document.querySelector('.player__previous');
	const nextButton = document.querySelector('.player__next');

	playButton.addEventListener('click', handlePlayButtonClick);
	previousButton.addEventListener('click', handlePreviousButtonClick);
	nextButton.addEventListener('click', handleNextButtonClick);

	function handlePlayButtonClick() {
		toggleIsPlaying();
		renderAudio();
		renderHTML();
	}

	function handlePreviousButtonClick() {
		previousTrack();
		loadTrackFromQue();
		isPlaying = true;
		renderAudio();
		renderHTML();
	}

	function handleNextButtonClick() {
		nextTrack();
		loadTrackFromQue();
		isPlaying = true;
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

	function nextTrack() {
		if (queIndex < que.length - 1) {
			queIndex += 1;
		} else {
			queIndex = 0;
		}
	}

	function previousTrack() {
		if (queIndex > 0) {
			queIndex -= 1;
		} else {
			queIndex = 0;
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
			const icon = isPlaying ? '_app/assets/svg/pause.svg' : '_app/assets/svg/play.svg';
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