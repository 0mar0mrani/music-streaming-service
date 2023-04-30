export default function shuffle(array, shuffleTimes) {
	let shuffledArray = array;
	
	for (let index = 0; index < shuffleTimes; index += 1) {
		shuffledArray = shuffledArray.sort(() => Math.random() - 0.5);
	}

	return shuffledArray;
}