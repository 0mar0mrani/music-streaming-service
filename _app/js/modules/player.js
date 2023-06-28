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
	const current = {
		queIndex: null,
		songGroupIndex: null,
		song: null,
		volume: 1,
	}
	let isPlaying = false;
	let isShuffle = false;
	let isRepeat = false;
	let isMute = false;
	
	// mobile player state 
	let isMobile = true;
	const mobileBreakpoint = 900;
	let isMaximized = false;
	let isAnimation = false; // animation wont happen if set to false
	let touchStart = null; // used to calculate percentage drag
	let draggedOver25Percent = false; 
	let animationPosition = null; // decides where in the animation (keyframe) on drag down
	const animationDuration = 0.7; // this has to be the same duration as --duration in variables.css 
	
	const playerElement = document.querySelector('.player');
	const allElementsInPlayer = playerElement.querySelectorAll('*');
	const mainWindowElement = document.querySelector('.main-window');
	const titleElement = document.querySelector('.player__title');
	const artistElement = document.querySelector('.player__artist');
	const artworkElement = document.querySelector('.player__artwork img');
	const playButton = document.querySelector('.player__play-button');
	const playButtonIcon = document.querySelector('.player__play-button img');
	const previousButton = document.querySelector('.player__previous-button');
	const nextButton = document.querySelector('.player__next-button');
	const shuffleButton = document.querySelector('.player__shuffle-button');
	const repeatButton = document.querySelector('.player__repeat-button');
	const volumeSlider = document.querySelector('.player__volume-slider');
	const muteButton = document.querySelector('.player__mute-button');
	const muteButtonIcon = document.querySelector('.player__mute-button img');
	const timelineSlider = document.querySelector('.player__timeline-slider');
	const timelineCurrentElement = document.querySelector('.player__current');
	const timelineDurationElement = document.querySelector('.player__duration');
	const closeButton = document.querySelector('.player__close-button');
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
		const touchedControllers = event.target.closest('.player__section-2');	

		if (isMaximized && !touchedControllers) {
			event.preventDefault();
			animateDragDown(event);
		}
	}

	function handlePlayerElementTouchend() {
		if (isMaximized) {
			setAnimationToRunning();
			isMaximized = false;

			if (!draggedOver25Percent) {
				isMaximized = true;
				setAnimationPositionForMaximized();
				renderHTML();
			}

			draggedOver25Percent = false;
		}
	}
	
	function handlePlayerElementClick() {
		isAnimation = true;
		isMaximized = true;
		removePlayerInlineStyling();
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
		setShuffle();
		setCurrentQueIndex();
		renderHTML();
	}

	function handleRepeatButtonClick() {
		isRepeat = !isRepeat;
		renderHTML();
	}

	function handleVolumeSliderInput() {
		setVolume();
		isMute = current.volume === 0 ? true : false;
		renderAudio();
		renderHTML();
	}

	function handleMuteButtonClick() {
		isMute = !isMute;
		renderAudio();
		renderHTML();
	}

	function handleTimelineSliderInput() {
		setTimeline();
		isPlaying = true;
		renderAudio();
		// renderHTML();
	}

	function handleCloseButtonClick(event) {
		event.stopPropagation();
		removePlayerInlineStyling();
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

	/**
	 * Sets current.songGroupIndex based on the index of the clicked song group.
	 * @param {number} clickedSongGroupIndex - The index of the song group in relation to all song groups.
	 */
	function setCurrentSongGroup(clickedSongGroupIndex) {
		current.songGroupIndex = clickedSongGroupIndex;
	}

	/**
	 * Sets the que based on currentSection
	 */
	function setQue() {
		if (currentSection === 'release') {
			que = [...releases[current.songGroupIndex].tracks];
		} else if (currentSection === 'playlist') {
			que = [...playlists[current.songGroupIndex].songs];
		}
	}

	/**
	 * Sets current.queIndex to the the clicked song, if you haven't clicked a song and this function runs it will look for itself in the que.
	 * @param {number} clickedSongIndex - The index of the song related to its song group
	 */
	function setCurrentQueIndex(clickedSongIndex) {
		if (clickedSongIndex => 0) {
			current.queIndex = clickedSongIndex;
		} else {
			const currentSongID = current.songIndex._id;
			const currentSongIndex = que.findIndex(song => song._id === currentSongID);
			current.queIndex = currentSongIndex;
		}
	}

	/**
	 * Shuffles the que if 'isShuffle = true', if not it sets the que from songGroup which is not shuffled.
	 */
	function setShuffle() {
		if (isShuffle) {
			que = shuffle(que, 2);
		} else {
			setQue();
		}
	}


	/**
	 * This loads current.songIndex into audio from que, decided by current.queIndex.
	 */
	function loadSongFromQue() {
		current.song = que[current.queIndex];
		audio.src = current.song.trackURL;
	}

	/**
	 * Function sets the sate of isPlaying, to the boolean it receives as parameter. If it does not receive a boolean, it sets it to the opposite. 
	 * @param {boolean} boolean - The value to set isPlaying to
	 */
	function toggleIsPlaying(boolean) {
		if (!boolean) {
			isPlaying = !isPlaying;
		} else {
			isPlaying = boolean;
		}
	}

	/**
	 * Increases the current.queIndex by 1, if it's at the end of que it sets it to 0. 
	 */
	function nextSong() {
		if (current.queIndex < que.length - 1) {
			current.queIndex += 1;
		} else {
			current.queIndex = 0;
		}
	}

	/**
	 * Decrements the current.queIndex by 1, unless it is already 0, in which case it sets the current.queIndex to 0.
	 */
	function previousSong() {
		if (current.queIndex > 0) {
			current.queIndex -= 1;
		} else {
			current.queIndex = 0;
		}
	}

	/**
	 * Sets currentSection, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {string} string - The name of the section to set
	 */
	function setCurrentSection(string) {
		currentSection = string;
	}

	/**
	 * Sets releases, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {array} array - An array of releases
	 */
	function setReleases(array) {
		releases = array;
	}

	/**
	 * Sets playlists, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {array} array - An array of playlists
	 */
	function setPlaylist(array) {
		playlists = array;
	}

	/**
	 * This traps the focus of the mobile player element. This is done to make keyboard navigation more pleasurable.
	 * @author Hidde de Vries 
	 * @see {@link https://hidde.blog/using-javascript-to-trap-focus-in-an-element/}
	 * @param {object} event - The event object that is passed to the function.
	 */
	function playerFocusTrap(event) {
		const focusableElements = playerElement.querySelectorAll('button:not(.player__mute-button), input.player__timeline-slider');
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

	/**
	 * Takes value from volumeSlider and sets current.volume.
	 */
	function setVolume() {
		const input = volumeSlider.value;
		current.volume = input;
	}

	/**
	 * Takes value from timelineSlider and sets currentTime.
	 */
	function setTimeline() {
		const input = timelineSlider.value;
		audio.currentTime = input;
	}

	/**
	 * This function renders the audio object. It will play or pause based on the state isPlaying, and set the volume to either 0 (mute) or the current volume based on isMute.
	 */
	function renderAudio() {
		isPlaying ? audio.play() : audio.pause();
		audio.volume = isMute ? 0 : current.volume;
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

	/**
	 * Removes all inline styling from the player element and all elements within it.
	 */
	function removePlayerInlineStyling() {
		playerElement.removeAttribute('style');
		
		for (const element of allElementsInPlayer) {
			element.removeAttribute('style');
		}
	}

	/**
	 * This main function consist of subfunctions that renders the HTML based on the state of player. There is a if statement to only render timeline as this will be called multiple times per seconds and dont want to render everything. This was done to improve performance. 
	 */
	function renderHTML(string) {
		if (string === 'timeline') {
			renderTimeline();
		} else {
			if (isPlaying) {
				renderVisibility();
				renderInfo();
			}

			if (isAnimation) {
				if (isMaximized) {
					renderMinimized();
				} else {
					renderMaximized();
				}
			} else {
				removeMaximizedAndMinimized();
			}
	
			renderAccessability();
			renderPlayButton();
			renderShuffleButton();
			renderRepeatButton();
			renderMuteButton();
			renderVolumeSlider();
		}

		function renderMaximized() {
			playerElement.classList.remove('player--maximized');
			playerElement.classList.add('player--minimized');
		}

		function renderMinimized() {
			playerElement.classList.add('player--maximized');
			playerElement.classList.remove('player--minimized');
		}

		function removeMaximizedAndMinimized() {
			playerElement.classList.remove('player--minimized');
			playerElement.classList.remove('player--maximized');
		}

		function renderVisibility() {
			playerElement.classList.add('player--open');
			mainWindowElement.classList.add('main-window--player-open'); // this compensate for the player's position absolute in mobile version, so elements won't go behind player. 
		}

		function renderInfo() {
			titleElement.innerText = current.song.title;
			artistElement.innerText = current.song.artists.join(', ');
			artworkElement.src = current.song.artworkURL;
			artworkElement.alt = current.song.artworkAlt;
		}

		/**
		 * Sets accessibility attributes on the player element and timeline slider based on isMobile.
		 */
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
				renderGoToControllersLink(); 

				/**
		 		 * Renders accessability link to jump straight to controllers.
		 		 */
				function renderGoToControllersLink() {
					accessabilitySkipToPlayerElement.innerHTML = '';
					const link = document.createElement('a');
					link.innerText = 'Go to controllers';
					link.className = 'accessibility__skip';
					link.href = '#player';
					accessabilitySkipToPlayerElement.append(link);
				}
			}
		}
		
		function renderPlayButton() {
			const icon = isPlaying ? '_app/assets/svg/pause.svg' : '_app/assets/svg/play.svg';
			playButtonIcon.src = icon;
		}

		function renderShuffleButton() {
			if (isShuffle) {
				shuffleButton.classList.add('player__shuffle-button--active');
			} else {
				shuffleButton.classList.remove('player__shuffle-button--active');
			}
		}

		function renderRepeatButton() {
			if (isRepeat) {
				repeatButton.classList.add('player__repeat-button--active');
			} else {
				repeatButton.classList.remove('player__repeat-button--active');
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

		/**
		 * Renders volumeSlider based on isMute and background of slider.
		 */
		function renderVolumeSlider() {
			if (isMute) {
				volumeSlider.value = 0;
			} else {
				volumeSlider.value = current.volume;
			}

			volumeSlider.style.background = `linear-gradient(to right, var(--color-primary-default) 50%, var(--color-primary-darkest) 50%) ${100 - audio.volume * 100}% 50% / 200%`;	
		}

		/**
		 * Renders the timeline slider by calculating percentage, updates the current time and duration as long as its a !isNaN. 
		 */
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
		setCurrentQueIndex,
		setCurrentSongGroup,
		setQue,
		setShuffle,
		loadSongFromQue,
		toggleIsPlaying,
		renderAudio,
		renderHTML,
	}
}