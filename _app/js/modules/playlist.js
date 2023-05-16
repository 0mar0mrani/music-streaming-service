export default function playlist(node) {
	let isOpen = false;

	const playlistElement = node;
	const playlistButton = node.querySelector('.playlist__button');

	playlistButton.addEventListener('click', handleClick);

	function handleClick() {
		isOpen = !isOpen;
		renderHTML() 
	}

	renderHTML();

	function renderHTML() {
		if (isOpen) {
			playlistElement.classList.add('playlist--open');
		} else {
			playlistElement.classList.remove('playlist--open');
		}
	}
}