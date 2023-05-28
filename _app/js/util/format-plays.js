/**
 * It takes a number as a parameter and returns a new number with commas added every third digit from right to left.
 * It iterates over number and each digit is added to formattedNumber, if the index is dividable by 3 and is not 0 it ads a comma as well indexIsDividableBy3andNot0.
 * @param {string} number - The number to be formatted
 * @returns {string} The formatted number string
 * @example
 * formatPlays('123456789') // returns '123,456,789'
 */
export default function formatPlays(number) {
	let formattedNumber = '';
	let count = 0;

	for (let index = number.length - 1; index >= 0; index -= 1) {
		count += 1;
		const character = number[index];
		
		formattedNumber = character + formattedNumber;

		const indexIsDividableBy3andNot0 = count % 3 === 0 && index !== 0;

		if (indexIsDividableBy3andNot0) {
			formattedNumber = ',' + formattedNumber;
		} 
	}

	return formattedNumber;
}