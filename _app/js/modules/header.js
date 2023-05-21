export default function header() {
	let currentSection = '';
	let message = '';
	let isMessageVisible = false;
	const messageDuration = 2 * 1000;

	const headerTitleElement = document.querySelector('.header__title');
	const messageElement = document.querySelector('.header__message');
	const createPlaylistButton = document.querySelector('.header__add-playlist-button');

	function setMessage(string) {
		message = string;
	}

	function setIsMessageVisible(boolean) {
		isMessageVisible = boolean;
	}

	function setCurrentSection(string) {
		currentSection = string;
	}

	function renderHTML() {		
		renderMessage();
		renderTitleAndButton();

		function renderMessage() {
			if (isMessageVisible) {
				messageElement.innerText = message;
				messageElement.classList.add('header__message--open');
	
				setTimeout(() => {
					isMessageVisible = false;
					message = '';
					renderHTML(); 
				}, messageDuration)
			} else {
				messageElement.classList.remove('header__message--open');
			}
		}

		function renderTitleAndButton() {
			if (currentSection === 'release') {
				headerTitleElement.innerText = 'Release';
				createPlaylistButton.classList.remove('header__add-playlist-button--visible');
			} else if (currentSection === 'playlist') {
				headerTitleElement.innerText = 'Playlist';
				createPlaylistButton.classList.add('header__add-playlist-button--visible');
			}
		}
	}
	
	return {
		setMessage,
		setIsMessageVisible,
		setCurrentSection,
		renderHTML,
	}
}