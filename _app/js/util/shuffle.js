/**
 * This function takes an array and a number of times to shuffle as parameters and returns a shuffled version of the array.
 * It loops the amount of time decided by shuffleTimes. It's using sort() method by generating a value of 0.5 or -0.5, this randomly sorts the array. 
 * @author Alexandra Pestruyeva
 * @see {@link https://medium.com/@apestruy/shuffling-an-array-in-javascript-8fcbc5ff12c7}
 * @param {Array} array - The array to be shuffled.
 * @param {number} shuffleTimes - The number of times to shuffle the array.
 * @returns {Array} - The shuffled array.
 * @example
 * let myArray = [1, 2, 3, 4, 5];
 * shuffle(myArray, 3) // returns [3, 5, 1, 4, 2]
 */
export default function shuffle(array, shuffleTimes) {
	let shuffledArray = array;
	
	for (let index = 0; index < shuffleTimes; index += 1) {
		shuffledArray = shuffledArray.sort(() => Math.random() - 0.5);
	}

	return shuffledArray;
}