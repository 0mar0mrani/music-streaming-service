export default function formatPlays(string) {
	let newString = '';
	let count = 0;

	for (let index = string.length - 1; index >= 0; index -= 1) {
		count += 1;
		const character = string[index];
		
		newString = character + newString;

		if (count % 3 === 0 && index !== 0) {
			newString = ',' + newString;
		} 
	}

	return newString;
}