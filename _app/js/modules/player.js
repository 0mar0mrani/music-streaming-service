import shuffle from '../util/shuffle.js';
import formatTimeToSeconds2 from '../util/format-time-to-seconds-2.js';

export default function player() {
	// global states
	let currentSection = null;
	let releases = null;
	let playlists = null;

	// player states
	const audio = new Audio();
	let que = [];
	let queIndex = null;
	let currentSong = null; 
	let currentSongGroup = null;
	let isPlaying = false;
	let isShuffle = false;
	let isRepeat = false;
	let isMute = false;
	let currentVolume = 1;
	
	// mobile player state 
	let isMobile = true;
	const mobileBreakpoint = 900;
	let isMaximized = false;
	let isAnimation = false; // animation wont happen if set to false
	let touchStart = null; // used to calculate percentage drag
	let draggedOver25Percent = false; 
	let animationPosition = null; // decides where in the animation (keyframe) on drag down
	const animationDuration = 0.7; // this has to be the same duration as animation duration
	
	const playerElement = document.querySelector('.player');
	const allElementsInPlayer = playerElement.querySelectorAll('*');
	const mainWindowElement = document.querySelector('.main-window');
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
	playerElement.addEventListener('touchstart', handlePlayerElementTouchstart, { passive: false }); // passive: false tells browser to expect preventDefault(), this was done to remove warning in console
	playerElement.addEventListener('touchmove', handlePlayerElementTouchmove, { passive: false });
	playerElement.addEventListener('touchend', handlePlayerElementTouchend);
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

	function handleWindowResize() {
		isMobile = window.innerWidth <= mobileBreakpoint ? true : false;
		isAnimation = false;
		renderHTML();
	}

	function handlePlayerElementTouchstart(event) {
		if (isMaximized) {
			setTouchStart(event);
		}
	}

	function handlePlayerElementTouchmove(event) {		
		if (isMaximized) {
			event.preventDefault();
			animateDragDown(event);
		}
	}

	function handlePlayerElementTouchend() {
		if (isMaximized) {
			setAnimationToRunning();

			if (!draggedOver25Percent) {
				isMaximized = true;
				setAnimationPositionForMaximized();
				renderHTML();
			}
		}
	}

	function handlePlayerElementClick() {
		isAnimation = true;
		isMaximized = true;
		removeInlineStyling();
		renderHTML();
	}

	function handlePlayerElementKeydown(event) {
		const key = event.key;
		const pressedOnPlayerElement = event.target.classList.contains('player');

		if (pressedOnPlayerElement && key === 'Enter') {
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

	function handleRepeatButtonClick() {
		isRepeat = !isRepeat;
		renderHTML();
	}

	function handleVolumeSliderInput() {
		const input = volumeSlider.value;
		currentVolume = input;
		currentVolume > 0 ? isMute = false : isMute = true;
		renderAudio();
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
		removeInlineStyling();
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

	/**
	 * This sets the variable touchStart, so animateDragDown can calculate dragDistance.
	 * @see animateDragDown()
	 * @param {object} event - The event object that is passed in when the function is called.
	 */
	function setTouchStart(event) {
		touchStart = event.touches[0].clientY;
	}

	/**
	 * This function animates on drag down of the player element.
	 * This is made possible by starting minimize-keyframes @see animation.css and set 'animationPlayState = paused' and decide where in the animation is by using the variable animationPosition and manipulating animationDelay. If the dragPercentage is over 25%, it will set 'draggedOver25Percent = true'. AnimationPlayState is set to linear so it will follows the finger on drag down, the animation is default set to ease-in-out. 
	 * @param {object} event - The event object that is passed in when the function is called.
	 */
	function animateDragDown(event) {
		const touchYCoordinates = event.touches[0].clientY;
		const playerHeight = playerElement.offsetHeight;
		const dragDistances = touchYCoordinates - touchStart;
		const dragPercentage = (dragDistances / playerHeight) * 100;
		const isNotNegativeDrag = dragPercentage >= 0;
		const dragPercentageUnder99 = dragPercentage < 99;
	  
	  	animationPosition = (dragPercentage / 100) * animationDuration;

		if (isNotNegativeDrag && dragPercentageUnder99) {
			playerElement.classList.add('player--minimized');
			playerElement.classList.remove('player--maximized');

			playerElement.style.animationTimingFunction = 'linear';
			playerElement.style.animationPlayState = 'paused';
			playerElement.style.animationDelay = `-${animationPosition}s`;
		
			for (const element of allElementsInPlayer) {
				element.style.animationTimingFunction = 'linear';
				element.style.animationPlayState = 'paused';
				element.style.animationDelay = `-${animationPosition}s`;
			}
			
			draggedOver25Percent = dragPercentage >= 25 ? true : false;
		}
	}

	/**
	 * Sets the animation play state of the player element and all elements in the player to 'running'.
	 */	
	function setAnimationToRunning() {
		playerElement.style.animationPlayState = 'running';
	
		for (const element of allElementsInPlayer) {
			element.style.animationPlayState = 'running';
		}
	}

	/**
	 * Sets start position of maximized animation for playerElement and all elements in the player, by how long the player is dragged down. This is done by subtracting animationDuration with animationPosition. That way maximized animation wont start from the bottom (default animation).
	 */
	function setAnimationPositionForMaximized() {
		playerElement.style.animationDelay = `-${animationDuration - animationPosition}s`;
		
		for (const element of allElementsInPlayer) {
			element.style.animationDelay = `-${animationDuration - animationPosition}s`;
		}
	}

	function removeInlineStyling() {
		playerElement.removeAttribute('style');
		
		for (const element of allElementsInPlayer) {
			element.removeAttribute('style');
		}
	}

	function renderHTML(string) {
		if (string === 'timeline') {
			renderTimeline()
		} else {
			renderAccessability();
			
			if (isPlaying) {
				playerElement.classList.add('player--open');
				mainWindowElement.classList.add('main-window--player-open');
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

			volumeSlider.style.background = `linear-gradient(to right, var(--color-primary-default) 50%, var(--color-primary-darkest) 50%) ${100 - audio.volume * 100}% 50% / 200%`;	
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