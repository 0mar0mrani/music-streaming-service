import shuffle from "../util/shuffle.js";

export default function player(releases) {
	let que = [];
	let queIndex = null;
	let currentTrack = null; 
	let currentRelease = null;
	let isPlaying = false;
	let isShuffle = false;
	let isRepeat = false;
	let isMute = false;
	const audio = new Audio();
	let currentVolume = 1;

	const playerElement = document.querySelector('.player');

	const titleElement = document.querySelector('.player__title');
	const artistElement = document.querySelector('.player__artist');
	const artworkElement = document.querySelector('.player__artwork img');

	const playButton = document.querySelector('.player__play');
	const playButtonIcon = document.querySelector('.player__play img');

	const previousButton = document.querySelector('.player__previous');
	const nextButton = document.querySelector('.player__next');

	const shuffleButton = document.querySelector('.player__shuffle');

	const repeatButton = document.querySelector('.player__repeat');

	const volumeSlider = document.querySelector('.player__volume');
	const muteButton = document.querySelector('.player__mute');

	playButton.addEventListener('click', handlePlayButtonClick);
	previousButton.addEventListener('click', handlePreviousButtonClick);
	nextButton.addEventListener('click', handleNextButtonClick);
	shuffleButton.addEventListener('click', handleShuffleButtonClick);
	repeatButton.addEventListener('click', handleRepeatButtonClick);
	volumeSlider.addEventListener('input', handleInputInput);
	muteButton.addEventListener('click', handleMuteButtonClick);


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

	function handleShuffleButtonClick() {
		isShuffle = !isShuffle;
		const currentTrackID = currentTrack._id;
		
		if (isShuffle) {
			que = shuffle(que, 2);
		} else {
			setQue();
		}

		const currentTrackNewIndex = que.findIndex(index => index._id === currentTrackID)
		queIndex = currentTrackNewIndex;
		renderHTML();
	}

	function handleInputInput() {
		const input = volumeSlider.value;
		currentVolume = input;
		audio.volume = currentVolume;
		renderHTML();
	}

	function handleRepeatButtonClick() {
		isRepeat = !isRepeat;
		renderHTML();
	}

	function handleMuteButtonClick() {
		isMute = !isMute;
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
		que = [...releases[currentRelease].tracks];
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
		isMute ? audio.volume = 0 : audio.volume = currentVolume;
   }

	function renderHTML() {
		if (isPlaying) {
			playerElement.classList.add('player--open');
			titleElement.innerText = currentTrack.title;
			artistElement.innerText = currentTrack.artists.join(', ');
			artworkElement.src = currentTrack.artworkURL;
		}

		renderPlayButton();
		renderShuffleButton();
		renderRepeatButton();

		function renderPlayButton() {
			const icon = isPlaying ? '_app/assets/svg/pause.svg' : '_app/assets/svg/play.svg';
			playButtonIcon.src = icon;
		}

		function renderShuffleButton() {
			if (isShuffle) {
				shuffleButton.classList.add('player__shuffle--active');
			} else {
				shuffleButton.classList.remove('player__shuffle--active');
			}
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