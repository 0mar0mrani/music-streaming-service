export default function contextMenu(currentSection, playlists) {
	let isOpen = false;
	let coordinates = {
		x: 0,
		y: 0,
	}

	let clickedElement = null;

	const contextMenuElement = document.querySelector('.context-menu');
	const contextMenuPlaylists = document.querySelector('.context-menu__playlists');
	const contextMenuReleaseSection = document.querySelector('.context-menu__release-section');
	const contextMenuPlaylistSection = document.querySelector('.context-menu__playlist-section');
	const deletePlaylist = document.querySelector('.context-menu__button--delete-playlist'); 
	const removeSong = document.querySelector('.context-menu__button--remove-song'); 

	function setIsOpen(boolean) {
		isOpen = boolean;
	}

	function setClickedElement(string) {
		clickedElement = string;
	}

	function setCoordinates(event) {
		const xCoordinates = event.clientX;
		const yCoordinates = event.clientY;

		coordinates = {
			x: xCoordinates,
			y: yCoordinates,
		}
	}

	function renderHTML() {
		isOpen ? contextMenuElement.classList.add('context-menu--open') : contextMenuElement.classList.remove('context-menu--open');

		contextMenuReleaseSection.classList.remove('context-menu__release-section--visible');
		deletePlaylist.classList.remove('context-menu__button--delete-playlist-visible');
		removeSong.classList.remove('context-menu__button--remove-song-visible');

		if (currentSection === 'release') {
			contextMenuReleaseSection.classList.add('context-menu__release-section--visible');

			contextMenuPlaylists.innerHTML = '';
	
			playlists.forEach((playlist, index) => {
				const playlistElement = document.createElement('li');
				const playlistButton = document.createElement('button');
	
				playlistButton.className = 'context-menu__button context-menu__button--add-playlist';
	
				playlistButton.innerText = playlist.title;
				playlistButton.dataset.id = index;
	
				playlistElement.append(playlistButton);
				contextMenuPlaylists.append(playlistElement)
			})
		} else if (currentSection === 'playlist') {
			if (clickedElement === 'playlist') {
				deletePlaylist.classList.add('context-menu__button--delete-playlist-visible');
			} else if (clickedElement === 'song') {
				removeSong.classList.add('context-menu__button--remove-song-visible');
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
		setCoordinates,
		setClickedElement,
		renderHTML,
	}
}