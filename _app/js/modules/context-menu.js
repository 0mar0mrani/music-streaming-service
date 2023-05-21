export default function contextMenu(currentSection, playlists) {
	let isOpen = false;
	let coordinates = {
		x: 0,
		y: 0,
	}

	let lastFocused = {
		song: null,
		songGroup: null,
	};

	let clickedElement = null;

	const contextMenuElement = document.querySelector('.context-menu');
	const contextMenuPlaylists = document.querySelector('.context-menu__playlists');
	const contextMenuReleaseSection = document.querySelector('.context-menu__release-section');
	const contextMenuPlaylistSection = document.querySelector('.context-menu__playlist-section');
	const deletePlaylist = document.querySelector('.context-menu__button--delete-playlist'); 
	const removeSong = document.querySelector('.context-menu__button--remove-song'); 

	contextMenuElement.addEventListener('keydown', handleContextMenuElementKeydown);

	function handleContextMenuElementKeydown(event) {
		if (event.key === 'Tab') {
			const focusableElements = document.querySelectorAll('.context-menu__button--visible')
			const activeElement = document.activeElement;
			const lastFocusableElement = focusableElements[focusableElements.length - 1]

			console.log(focusableElements);
			
			if (activeElement === lastFocusableElement) {
				focusOnLastFocusedSong(event);
				renderHTML();
			}

		} else if (event.key === 'Escape') {
			focusOnLastFocusedSong(event);
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

	function findLastFocusedSong() {
		const songGroups = document.querySelectorAll('.song-group');
		const songs = songGroups[lastFocused.songGroup].querySelectorAll('.song');
		const rightSong = songs[lastFocused.song];
		return rightSong;
	}

	function focusOnLastFocusedSong(event) {
		event.preventDefault();
		isOpen = false;
		const lastFocusedSong = findLastFocusedSong();
		lastFocusedSong.focus();
	}

	function renderHTML() {
		isOpen ? contextMenuElement.classList.add('context-menu--open') : contextMenuElement.classList.remove('context-menu--open');

		contextMenuReleaseSection.classList.remove('context-menu__release-section--visible');
		contextMenuPlaylistSection.classList.remove('context-menu__playlist-section--visible');
		deletePlaylist.classList.remove('context-menu__button--visible');
		removeSong.classList.remove('context-menu__button--visible');

		if (currentSection === 'release') {
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
		} else if (currentSection === 'playlist') {
			contextMenuPlaylistSection.classList.add('context-menu__playlist-section--visible');

			if (clickedElement === 'playlist') {
				deletePlaylist.classList.add('context-menu__button--visible');
			} else if (clickedElement === 'song') {
				removeSong.classList.add('context-menu__button--visible');
			}
		} 


		renderPlacement();

		function renderPlacement() {
			contextMenuElement.style.top = `${coordinates.y}px`;
			contextMenuElement.style.left = `${coordinates.x}px`;

			const contextWidth = contextMenuElement.clientWidth;
			const contextHeight = contextMenuElement.clientHeight;

			const contextMenuOutsideWindowRight = (window.innerWidth - (coordinates.x + contextWidth)) <= 0;
			const contextMenuOutsideWindowBottom = (window.innerHeight - (coordinates.y + contextHeight)) <= 0;

			contextMenuElement.style.transform = `translate(${contextMenuOutsideWindowRight ? '-100%' : '0'}, ${contextMenuOutsideWindowBottom ? '-100%' : '0'})`;
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