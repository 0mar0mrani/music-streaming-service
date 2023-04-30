export default function player(releases) {
	let que = [];
	let queIndex = null;
	let currentTrack = null; 
	let currentRelease = null;
	let isPlaying = false;
	let isRepeat = false;
	const audio = new Audio();

	const playerElement = document.querySelector('.player');

	const titleElement = document.querySelector('.player__title');
	const artistElement = document.querySelector('.player__artist');
	const artworkElement = document.querySelector('.player__artwork img');

	const playButton = document.querySelector('.player__play');
	const playButtonIcon = document.querySelector('.player__play img');

	const previousButton = document.querySelector('.player__previous');
	const nextButton = document.querySelector('.player__next');

	const repeatButton = document.querySelector('.player__repeat');

	playButton.addEventListener('click', handlePlayButtonClick);
	previousButton.addEventListener('click', handlePreviousButtonClick);
	nextButton.addEventListener('click', handleNextButtonClick);
	repeatButton.addEventListener('click', handleRepeatButtonClick);

	function handlePlayButtonClick() {
		toggleIsPlaying();
		renderAudio();
		renderHTML();
	}

	function handlePreviousButtonClick() {
		!isRepeat && previousTrack();
		loadTrackFromQue();
		isPlaying = true;
		renderAudio();
		renderHTML();
	}

	function handleNextButtonClick() {
		!isRepeat && nextTrack();
		loadTrackFromQue();
		isPlaying = true;
		renderAudio();
		renderHTML();
	}

	function handleRepeatButtonClick() {
		isRepeat = !isRepeat;
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
		renderRepeatButton();

		function renderPlayButton() {
			const icon = isPlaying ? '_app/assets/svg/pause.svg' : '_app/assets/svg/play.svg';
			playButtonIcon.src = icon;
		}

		function renderRepeatButton() {
			if (isRepeat) {
				repeatButton.classList.add('player__repeat--active');
			} else {
				repeatButton.classList.remove('player__repeat--active');
			}
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