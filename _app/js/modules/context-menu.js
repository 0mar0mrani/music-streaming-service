export default function contextMenu(playlists) {
	let isOpen = false;
	let coordinates = {
		x: 0,
		y: 0,
	}

	const contextMenuElement = document.querySelector('.context-menu');
	const contextMenuPlaylists = document.querySelector('.context-menu__playlists');

	function setIsOpen(boolean) {
		isOpen = boolean;
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
		contextMenuElement.style.top = `${coordinates.y}px`;
		contextMenuElement.style.left = `${coordinates.x}px`;

		isOpen ? contextMenuElement.classList.add('context-menu--open') : contextMenuElement.classList.remove('context-menu--open');

		contextMenuPlaylists.innerHTML = '';

		playlists.forEach((playlist, index) => {
			const playlistElement = document.createElement('li');
			const playlistButton = document.createElement('button');

			playlistButton.className = 'context-menu__button';

			playlistButton.innerText = playlist.title;
			playlistButton.dataset.id = index;

			playlistElement.append(playlistButton);
			contextMenuPlaylists.append(playlistElement)
		})

		renderPlacement();

		function renderPlacement() {
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
		renderHTML,
	}
}