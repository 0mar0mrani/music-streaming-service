export default function header() {
	let currentSection = '';
	let message = '';
	let isMessageVisible = false;

	const messageDuration = 2 * 1000;

	const headerTitleElement = document.querySelector('.header__title');
	const messageElement = document.querySelector('.header__message');
	const createPlaylistButton = document.querySelector('.header__create-playlist-button');

	/**
	 * Sets message, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {string} string - The string to set message
	 */
	function setMessage(string) {
		message = string;
	}

	/**
	 * Sets if message should be visible, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {boolean} boolean - To set if true or false
	 */
	function setIsMessageVisible(boolean) {
		isMessageVisible = boolean;
	}

	/**
	 * Sets currentSection, this function was made to be used by main-window.js.
	 * @see main-window.js
	 * @param {string} string - The string to set currentSection
	 */
	function setCurrentSection(string) {
		currentSection = string;
	}

	/**
	 * This main function consist of subfunctions that renders the HTML based on the state of header. 
	 */
	function renderHTML() {		
		renderMessage();
		renderTitleAndButton();

		/**
		 * Renders message if isMessageVisible is set to true, and removes message with setTimeout after the duration of messageDuration. 
		 */
		function renderMessage() {
			if (isMessageVisible) {
				messageElement.innerText = message;
				messageElement.classList.add('header__message--open');
	
				setTimeout(() => {
					isMessageVisible = false;
					message = '';
					renderHTML(); 
				}, messageDuration);
			} else {
				messageElement.classList.remove('header__message--open');
			}
		}

		/**
		 * Renders title and button in header. 
		 */
		function renderTitleAndButton() {
			if (currentSection === 'release') {
				headerTitleElement.innerText = 'Releases';
				createPlaylistButton.classList.remove('header__create-playlist-button--visible');
			} else if (currentSection === 'playlist') {
				headerTitleElement.innerText = 'Playlists';
				createPlaylistButton.classList.add('header__create-playlist-button--visible');
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