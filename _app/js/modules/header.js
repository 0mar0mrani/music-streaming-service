export default function header() {
	let message = '';
	let isVisible = false;

	const messageElement = document.querySelector('.header__message');

	function setMessage(string) {
		message = string;
	}

	function setIsVisible(boolean) {
		isVisible = boolean;
	}

	function renderHTML() {		
		if (isVisible) {
			messageElement.innerText = message;
			messageElement.classList.add('header__message--open');

			setTimeout(() => {
				isVisible = false;
				renderHTML(); 
			}, 2000)
		} else {
			messageElement.classList.remove('header__message--open');
		}
	}
	
	return {
		setMessage,
		setIsVisible,
		renderHTML,
	}
}