export default function header() {
	let message = '';
	let isVisible = false;
	let currentSection = '';

	const headerTitle = document.querySelector('.header__title');
	const messageElement = document.querySelector('.header__message');
	const createPlaylist = document.querySelector('.header__add-playlist-button');

	function setMessage(string) {
		message = string;
	}

	function setIsVisible(boolean) {
		isVisible = boolean;
	}

	function setCurrentSection(string) {
		currentSection = string;
	}

	function renderHTML() {		
		if (isVisible) {
			messageElement.innerText = message;
			messageElement.classList.add('header__message--open');

			setTimeout(() => {
				isVisible = false;
				message = '';
				renderHTML(); 
			}, 2000)
		} else {
			messageElement.classList.remove('header__message--open');
		}

		if (currentSection === 'release') {
			headerTitle.innerText = 'Release';
			createPlaylist.classList.remove('header__add-playlist-button--visible');
		} else if (currentSection === 'playlist') {
			headerTitle.innerText = 'Playlist';
			createPlaylist.classList.add('header__add-playlist-button--visible');
		}
	}
	
	return {
		setMessage,
		setIsVisible,
		setCurrentSection,
		renderHTML,
	}
}