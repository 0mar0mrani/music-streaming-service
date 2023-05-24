import shuffle from '../util/shuffle.js';
import formatTimeToSeconds2 from '../util/format-time-to-seconds-2.js';

export default function player() {
	let currentSection = null;
	let releases = null;
	let playlists = null;
	let que = [];
	let queIndex = null;
	let currentSong = null; 
	let currentSongGroup = null;
	let isPlaying = false;
	let isShuffle = false;
	let isRepeat = false;
	let isMute = false;
	let isAnimation = false; // making sure the player only animate at right times
	let isMaximized = false;
	const audio = new Audio();
	let currentVolume = 1;

	let isMobile = true;
	const mobileBreakpoint = 900;

	let touchStart = null; // for drag player to close
	let over50Percent = false;
	let animationDelay = null;
	const animationDuration = 0.7;

	const playerElement = document.querySelector('.player');
	const allElementsInPlayer = playerElement.querySelectorAll('*');

	const mainWindow = document.querySelector('.main-window');

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
	const muteButtonIcon = document.querySelector('.player__mute img');

	const timelineSlider = document.querySelector('.player__timeline');
	const timelineCurrentElement = document.querySelector('.player__current');
	const timelineDurationElement = document.querySelector('.player__duration');

	const closeButton = document.querySelector('.player__close');
	const accessabilitySkipToPlayerElement = document.querySelector('.accessibility__player');

	window.addEventListener('resize', handleWindowResize);
	playerElement.addEventListener('click', handlePlayerElementClick);
	playerElement.addEventListener('keydown', handlePlayerElementKeydown)
	playButton.addEventListener('click', handlePlayButtonClick);
	previousButton.addEventListener('click', handlePreviousButtonClick);
	nextButton.addEventListener('click', handleNextButtonClick);
	shuffleButton.addEventListener('click', handleShuffleButtonClick);
	repeatButton.addEventListener('click', handleRepeatButtonClick);
	volumeSlider.addEventListener('input', handleVolumeSliderInput);
	muteButton.addEventListener('click', handleMuteButtonClick);
	timelineSlider.addEventListener('input', handleTimelineSliderInput);
	closeButton.addEventListener('click', handleCloseButtonClick);
	audio.addEventListener('loadedmetadata', handleAudioLoadedmetadata);
	audio.addEventListener('timeupdate', handleAudioTimeupdate);

	playerElement.addEventListener('touchstart', handlePlayerElementTouchstart);
	playerElement.addEventListener('touchmove', handlePlayerElementTouchmove);
	playerElement.addEventListener('touchend', handlePlayerElementTouchend);

	function handleWindowResize() {
		isMobile = window.innerWidth <= mobileBreakpoint ? true : false;
		isAnimation = false;
		renderHTML();
	}

	function handlePlayerElementClick() {
		isAnimation = true;
		isMaximized = true;
		renderHTML();
	}

	function handlePlayerElementKeydown(event) {
		const key = event.key;

		if (key === 'Enter') {
			isAnimation = true;
			isMaximized = true;
		}

		if (key === 'Tab' && isMaximized) {
			playerFocusTrap(event);
		}

		if (key === 'Escape') {
			isMaximized = false;
		}

		renderHTML();
	}

	function handlePlayButtonClick(event) {
		event.stopPropagation();
		toggleIsPlaying();
		renderAudio();
		renderHTML();
	}

	function handlePreviousButtonClick() {
		!isRepeat && previousSong();
		loadSongFromQue();
		isPlaying = true;
		renderAudio();
		renderHTML();
	}

	function handleNextButtonClick() {
		!isRepeat && nextSong();
		loadSongFromQue();
		isPlaying = true;
		renderAudio();
		renderHTML();
	}

	function handleShuffleButtonClick() {
		isShuffle = !isShuffle;
		const currentTrackID = currentSong._id;
		
		if (isShuffle) {
			que = shuffle(que, 2);
		} else {
			setQue();
		}

		const currentTrackNewIndex = que.findIndex(index => index._id === currentTrackID)
		queIndex = currentTrackNewIndex;
		renderHTML();
	}

	function handleVolumeSliderInput() {
		const input = volumeSlider.value;
		currentVolume = input;
		currentVolume > 0 ? isMute = false : isMute = true;
		renderAudio();
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

	function handleTimelineSliderInput() {
		const input = timelineSlider.value;
		audio.currentTime = input;
		isPlaying = true;
		renderHTML();
	}

	function handleCloseButtonClick(event) {
		event.stopPropagation();
		playerElement.removeAttribute('style');
		
		for (const element of allElementsInPlayer) {
			element.removeAttribute('style');
		}
		
		isAnimation = true;
		isMaximized = false;
		renderHTML();
	}

	function handleAudioLoadedmetadata() {
		renderHTML('timeline');
	}

	function handleAudioTimeupdate() {
		const reachedEnd = audio.currentTime === audio.duration;

		if (reachedEnd) {
			!isRepeat && nextSong();
			loadSongFromQue();
			renderAudio();
			renderHTML();
		} else {
			renderHTML('timeline');
		}
	}

	function handlePlayerElementTouchstart(event) {
		if (isMaximized) {
			touchStart = event.touches[0].clientY;
		}
	}

	function handlePlayerElementTouchmove(event) {		
		if (isMaximized) {
			event.preventDefault();
			const touchY = event.touches[0].clientY;
		 	const playerHeight = playerElement.offsetHeight;
		 	const dragDistances = touchY - touchStart;
		 	const touchPercentage = (dragDistances / playerHeight) * 100;
			
			animationDelay = (touchPercentage / 100) * animationDuration;

			if (touchPercentage >= 0 && touchPercentage < 99) {
				over50Percent = touchPercentage >= 25 ? true : false

				playerElement.style.animationPlayState = 'paused';
				playerElement.style.animationDelay = `-${animationDelay}s`;
				
				for (const element of allElementsInPlayer) {
					element.style.animationPlayState = 'paused';
					element.style.animationDelay = `-${animationDelay}s`;
				}				

				playerElement.classList.remove('player--maximized');
				playerElement.classList.add('player--minimized');
			}
		}
	}

	function handlePlayerElementTouchend() {
		if (isMaximized) {
			playerElement.style.animationPlayState = 'running';
			
			for (const element of allElementsInPlayer) {
				element.style.animationPlayState = 'running';
			}

			if (!over50Percent) {
				isMaximized = true;
				playerElement.style.animationDelay = `-${animationDuration - animationDelay}s`;
				
				for (const element of allElementsInPlayer) {
					element.style.animationDelay = `-${animationDuration - animationDelay}s`;
				}

				renderHTML();
			}
		}
	}

	function setCurrentSong(clickedSongNumber) {
		queIndex = Number(clickedSongNumber);
	}

	function setCurrentSongGroup(clickedSongGroupNumber) {
		currentSongGroup = Number(clickedSongGroupNumber);
	}

	function setQue() {
		if (currentSection === 'release') {
			que = [...releases[currentSongGroup].tracks];
		} else if (currentSection === 'playlist') {
			que = [...playlists[currentSongGroup].songs];
		}
	}

	function loadSongFromQue() {
		currentSong = que[queIndex];
		audio.src = currentSong.trackURL;
	}

	function toggleIsPlaying(boolean) {
		if (!boolean) {
			isPlaying = !isPlaying;
		} else {
			isPlaying = boolean;
		}
	}

	function nextSong() {
		if (queIndex < que.length - 1) {
			queIndex += 1;
		} else {
			queIndex = 0;
		}
	}

	function previousSong() {
		if (queIndex > 0) {
			queIndex -= 1;
		} else {
			queIndex = 0;
		}
	}

	function setCurrentSection(string) {
		currentSection = string;
	}

	function setReleases(array) {
		releases = array;
	}

	function setPlaylist(array) {
		playlists = array;
	}

	function playerFocusTrap(event) {
		const focusableElements = playerElement.querySelectorAll('button:not(.player__mute), input.player__timeline');
		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];
		const activeElement = document.activeElement;
		const shiftKeyPressed = event.shiftKey;

		if (shiftKeyPressed && activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		} else if (!shiftKeyPressed && activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	}

	function renderAudio() {
		isPlaying ? audio.play() : audio.pause();
		isMute ? audio.volume = 0 : audio.volume = currentVolume;
   }

	function renderHTML(string) {

		if (string === 'timeline') {
			renderTimeline()
		} else {
			renderAccessability();
			
			if (isPlaying) {
				playerElement.classList.add('player--open');
				mainWindow.classList.add('main-window--player-open');
				renderInfo();
			}

			if (isAnimation) {
				if (isMaximized) {
					playerElement.classList.add('player--maximized');
					playerElement.classList.remove('player--minimized');
				} else {
					playerElement.classList.remove('player--maximized');
					playerElement.classList.add('player--minimized');
				}
			} else {
				playerElement.classList.remove('player--minimized');
				playerElement.classList.remove('player--maximized');
			}
	
			renderPlayButton();
			renderShuffleButton();
			renderRepeatButton();
			renderMuteButton();
			renderVolumeSlider();
		}

		function renderInfo() {
			titleElement.innerText = currentSong.title;
			artistElement.innerText = currentSong.artists.join(', ');
			artworkElement.src = currentSong.artworkURL;
		}

		function renderAccessability() {
				if (isMobile) {
					playerElement.setAttribute('role', 'button');
					playerElement.setAttribute('tabindex', '0');
	
					if (isMaximized) {
						timelineSlider.removeAttribute('tabindex');
						playerElement.setAttribute('aria-expanded', 'true');
					} else {
						timelineSlider.setAttribute('tabindex', '-1');
						playerElement.setAttribute('aria-expanded', 'false');
					}
				} else {
					playerElement.removeAttribute('role');
					playerElement.removeAttribute('tabindex');
					timelineSlider.removeAttribute('tabindex');
					playerElement.removeAttribute('aria-expanded');
				}

				if (isPlaying) {
					accessabilitySkipToPlayerElement.innerHTML = '';
					const link = document.createElement('a');
					link.innerText = 'Go to controllers';
					link.className = 'accessibility__skip';
					link.href = '#player';
					accessabilitySkipToPlayerElement.append(link);
				}
			}
		
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

		function renderMuteButton() {
			const volume = audio.volume;

			if (volume === 0) {
				muteButtonIcon.src = '_app/assets/svg/volume-0.svg';
			} else if (volume > 0 && volume < 0.5) {
				muteButtonIcon.src = '_app/assets/svg/volume-1.svg';
			} else if (volume >= 0.5 && volume < 0.9) {
				muteButtonIcon.src = '_app/assets/svg/volume-2.svg';
			} else {
				muteButtonIcon.src = '_app/assets/svg/volume-3.svg';
			}
		}

		function renderVolumeSlider() {
			if (isMute) {
				volumeSlider.value = 0;
			} else {
				volumeSlider.value = currentVolume;
			}
		}

		function renderTimeline() {
			const duration = audio.duration;
			const currentTime = audio.currentTime;
			const percentage = (currentTime / duration) * 100;
			const formattedCurrentTime = formatTimeToSeconds2(currentTime);
			const formattedDuration = formatTimeToSeconds2(duration);
			timelineSlider.max = duration;
			timelineSlider.value = currentTime;
			
			if (!isNaN(duration)) {
				timelineCurrentElement.innerText = formattedCurrentTime;
				timelineDurationElement.innerText = formattedDuration;
			}

			timelineSlider.style.background = `linear-gradient(to right, var(--color-primary-default) 50%, var(--color-primary-darkest) 50%) ${100 - percentage}% 50% / 200%`;			
		}
	}

	return {
		setCurrentSection,
		setReleases,
		setPlaylist,
		setCurrentSong,
		setCurrentSongGroup,
		setQue,
		loadSongFromQue,
		toggleIsPlaying,
		renderAudio,
		renderHTML,
	}
}