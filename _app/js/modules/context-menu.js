export default function contextMenu() {
	let currentSection = null;
	let playlists = null;
	let isOpen = false;
	let clickedElement = null;
	
	let coordinates = {
		x: 0,
		y: 0,
	}

	let lastFocused = {
		song: null,
		songGroup: null,
	};

	const contextMenuElement = document.querySelector('.context-menu');
	const contextMenuPlaylists = document.querySelector('.context-menu__playlists');
	const contextMenuReleaseSection = document.querySelector('.context-menu__release-section');
	const contextMenuPlaylistSection = document.querySelector('.context-menu__playlist-section');
	const deletePlaylistButton = document.querySelector('.context-menu__button--delete-playlist'); 
	const deleteSongButton = document.querySelector('.context-menu__button--remove-song'); 

	contextMenuElement.addEventListener('keydown', handleContextMenuElementKeydown);

	function handleContextMenuElementKeydown(event) {
		if (event.key === 'Tab') {
			const focusableElements = document.querySelectorAll('.context-menu__button--visible')
			const activeElement = document.activeElement;
			const lastFocusableElement = focusableElements[focusableElements.length - 1]
			
			if (activeElement === lastFocusableElement) {
				focusOnLastFocusedElement(event);
				renderHTML();
			}

		} else if (event.key === 'Escape') {
			focusOnLastFocusedElement(event);
			renderHTML();

		} else if (event.key === 'Enter') {
			focusOnLastFocusedElement(event);
			renderHTML();
		}
	}

	function setIsOpen(boolean) {
		isOpen = boolean;
	}

	function setClickedElement(string) {
		clickedElement = string;
	}

	function setCoordinates(xCoordinates, yCoordinates) {
		coordinates = {
			x: xCoordinates,
			y: yCoordinates,
		}
	}

	function setCurrentSection(string) {
		currentSection = string;
	}

	function setPlaylists(string) {
		playlists = string;
	}

	function setLastFocused(object) {
		lastFocused = object;
	}

	function findLastFocusedElement() {
		if (clickedElement === 'playlist') {
			const menuButtons = document.querySelectorAll('.context-menu-button');
			const lastFocusedMenuButton = menuButtons[lastFocused.songGroup];
			return lastFocusedMenuButton;
		} else {
			const songGroups = document.querySelectorAll('.song-group');
			const songs = songGroups[lastFocused.songGroup].querySelectorAll('.song');
			const lastFocusedSong = songs[lastFocused.song];
			return lastFocusedSong;
		}
	}

	function focusOnLastFocusedElement(event) {
		event.preventDefault();
		isOpen = false;
		const lastFocusedElement = findLastFocusedElement();
		lastFocusedElement.focus();
	}

	function renderHTML() {
		contextMenuReleaseSection.classList.remove('context-menu__release-section--visible');
		contextMenuPlaylistSection.classList.remove('context-menu__playlist-section--visible');
		deletePlaylistButton.classList.remove('context-menu__button--visible');
		deleteSongButton.classList.remove('context-menu__button--visible');

		if (currentSection === 'release') {
			renderPlaylists();
		} else if (currentSection === 'playlist') {
			renderDeleteSongAndPlaylist();
		} 

		renderPlacement();
		renderVisibility();

		function renderVisibility() {
			if (isOpen) {
				contextMenuElement.classList.add('context-menu--open');
			} else {
				contextMenuElement.classList.remove('context-menu--open');
			}
		} 

		function renderPlacement() {
			contextMenuElement.style.top = `${coordinates.y}px`;
			contextMenuElement.style.left = `${coordinates.x}px`;

			const contextWidth = contextMenuElement.clientWidth;
			const contextHeight = contextMenuElement.clientHeight;

			const contextMenuOutsideWindowRight = (window.innerWidth - (coordinates.x + contextWidth)) <= 0;
			const contextMenuOutsideWindowBottom = (window.innerHeight - (coordinates.y + contextHeight)) <= 0;

			contextMenuElement.style.transform = `translate(${contextMenuOutsideWindowRight ? '-100%' : '0'}, ${contextMenuOutsideWindowBottom ? '-100%' : '0'})`;
		}

		function renderPlaylists() {
			contextMenuReleaseSection.classList.add('context-menu__release-section--visible');

			contextMenuPlaylists.innerHTML = '';
	
			playlists.forEach((playlist, index) => {
				const playlistElement = document.createElement('li');
				const playlistButton = document.createElement('button');
	
				playlistButton.className = 'context-menu__button context-menu__button--visible context-menu__button--add-playlist';
	
				playlistButton.innerText = playlist.title;
				playlistButton.dataset.id = index;
	
				playlistElement.append(playlistButton);
				contextMenuPlaylists.append(playlistElement)
			})
		}

		function renderDeleteSongAndPlaylist() {
			contextMenuPlaylistSection.classList.add('context-menu__playlist-section--visible');

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