export default function contextMenu() {
	let currentSection = null;
	let playlists = null;
	let isOpen = false;
	let clickedElement = null; // Used to decide content of context menu	

	let coordinates = { // Used to place context menu on screen
		x: 0,
		y: 0,
	}

	let lastFocused = { // Used to focus back on elements after closing context menu
		song: null,
		songGroup: null,
	};

	const contextMenuElement = document.querySelector('.context-menu');
	const playlistsElement = document.querySelector('.context-menu__playlists');
	const releaseSectionElement = document.querySelector('.context-menu__release-section');
	const playlistSectionElement = document.querySelector('.context-menu__playlist-section');
	const deletePlaylistButton = document.querySelector('.context-menu__button--delete-playlist'); 
	const deleteSongButton = document.querySelector('.context-menu__button--remove-song'); 

	contextMenuElement.addEventListener('keydown', handleContextMenuElementKeydown);

	/**
	 * This handles all key input on context menu.
	 * To make this I took inspiration from playerFocusTrap(). 
	 * @see playerFocusTrap in player.js
	 */
	function handleContextMenuElementKeydown(event) {
		if (event.key === 'Tab') {
			const focusableElements = document.querySelectorAll('.context-menu__button--visible');
			const activeElement = document.activeElement;
			const lastFocusableElement = focusableElements[focusableElements.length - 1];
			
			if (activeElement === lastFocusableElement) {
				focusOnLastFocusedElement(event);
				isOpen = false;
				renderHTML();
			}
			
		} else if (event.key === 'Escape') {
			focusOnLastFocusedElement(event);
			isOpen = false;
			renderHTML();

		} else if (event.key === 'Enter') {
			const button = event.target;
			button.click();
			focusOnLastFocusedElement(event);
			isOpen = false;
			renderHTML();
		}
	}

	/**
	 * Sets isOpen, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {boolean} boolean - The value to set is open to
	 */
	function setIsOpen(boolean) {
		isOpen = boolean;
	}

	/**
	 * Sets isOpen, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {string} string - The name of clicked element. Either 'playlist' or 'song'
	 */
	function setClickedElement(string) {
		clickedElement = string;
	}

	/**
	 * Sets isOpen, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {number} xCoordinates - The x coordinate of click/button
	 * @param {number} yCoordinates - The y coordinate of click/button
	 */
	function setCoordinates(xCoordinates, yCoordinates) {
		coordinates = {
			x: xCoordinates,
			y: yCoordinates,
		}
	}

	/**
	 * Sets currentSection, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {string} string - The string to set as the current section
	 */
	function setCurrentSection(string) {
		currentSection = string;
	}

	/**
	 * Sets playlists, this function was made to be used by main-window.js.
	 * @see main-window.js
	 *	@param {array} array - An array of playlists
	 */
	function setPlaylists(array) {
		playlists = array;
	}


	/**
	 * Sets last focused element, this function was made to be used by main-window.js.
	 * @see main-window.js
	 *	@param {object} object - An object containing the index of last focused song and songGroup
	 */
	function setLastFocused(object) {
		lastFocused = object;
	}

	/**
	 * Focuses on lastFocusedElement
	 */
	function focusOnLastFocusedElement(event) {
		event.preventDefault();
		const lastFocusedElement = findLastFocusedElement();
		lastFocusedElement.focus();
	}

	/**
	 * finds the last focused element. If 'clickedElement === `playlist`' it will find the last focused contextMenuButton, if not it will find last focused song.
	 * @returns {object} lastFocusedElement - The last focused element
	 */
	function findLastFocusedElement() {
		let lastFocusedElement = null;

		if (clickedElement === 'playlist') {
			const contextMenuButtons = document.querySelectorAll('.context-menu-button');
			lastFocusedElement = contextMenuButtons[lastFocused.songGroup];
		} else {
			const songGroups = document.querySelectorAll('.song-group');
			const songs = songGroups[lastFocused.songGroup].querySelectorAll('.song');
			lastFocusedElement = songs[lastFocused.song];
		}

		return lastFocusedElement;
	}

	/**
	 * This main function consist of subfunctions that renders the HTML based on the state of context menu. With a conditional rendering based on currentSection.  
	 */
	function renderHTML() {
		hideContent();

		if (currentSection === 'release') {
			renderPlaylists();
		} else if (currentSection === 'playlist') {
			renderDeleteSongAndPlaylist();
		} 

		renderPlacement();
		renderVisibility();

		function hideContent() {
			releaseSectionElement.classList.remove('context-menu__release-section--visible');
			playlistSectionElement.classList.remove('context-menu__playlist-section--visible');
			deletePlaylistButton.classList.remove('context-menu__button--visible');
			deleteSongButton.classList.remove('context-menu__button--visible');
		}

		function renderVisibility() {
			if (isOpen) {
				contextMenuElement.classList.add('context-menu--open');
			} else {
				contextMenuElement.classList.remove('context-menu--open');
			}
		} 

		/**
	 	 * Renders the placement of context menu by taking the coordinates of click in window. 
		 * If click is close to right or bottom edge it will place context menu on the opposite side of click, so context menu will never go outside of viewport. 
	 	 */
		function renderPlacement() {
			contextMenuElement.style.top = `${coordinates.y}px`;
			contextMenuElement.style.left = `${coordinates.x}px`;

			const contextWidth = contextMenuElement.clientWidth;
			const contextHeight = contextMenuElement.clientHeight;

			const contextMenuOutsideWindowRight = (window.innerWidth - (coordinates.x + contextWidth)) <= 0;
			const contextMenuOutsideWindowBottom = (window.innerHeight - (coordinates.y + contextHeight)) <= 0;

			contextMenuElement.style.transform = `translate(${contextMenuOutsideWindowRight ? '-100%' : '0'}, ${contextMenuOutsideWindowBottom ? '-100%' : '0'})`;
		}

		/**
	 	 * Renders playlists buttons in context menu. 
	 	 */
		function renderPlaylists() {
			releaseSectionElement.classList.add('context-menu__release-section--visible');

			playlistsElement.innerHTML = '';
	
			playlists.forEach((playlist, index) => {
				const playlistElement = document.createElement('li');
				const playlistButton = document.createElement('button');
	
				playlistButton.className = 'context-menu__button context-menu__button--visible context-menu__button--add-playlist';
	
				playlistButton.innerText = playlist.title;
				playlistButton.dataset.id = index;
	
				playlistElement.append(playlistButton);
				playlistsElement.append(playlistElement)
			})
		}

		/**
	 	 * Renders delete song and delete playlist button. 
	 	 */
		function renderDeleteSongAndPlaylist() {
			playlistSectionElement.classList.add('context-menu__playlist-section--visible');

			if (clickedElement === 'playlist') {
				deletePlaylistButton.classList.add('context-menu__button--visible');
			} else if (clickedElement === 'song') {
				deleteSongButton.classList.add('context-menu__button--visible');
			}
		}
	}

	return {
		setIsOpen,
		setCurrentSection,
		setPlaylists,
		setCoordinates,
		setClickedElement,
		setLastFocused,
		renderHTML,
	}
}