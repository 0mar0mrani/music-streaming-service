/**
 * Formats a given ISO date into a string of format 'month(name) day(number) year(number)'
 * @param {string} isoDate - The ISO date to be formatted
 * @returns {string} The formatted date
 * @example
 * formatDate('2022-11-04') // returns 'November 4 2022'
 */
export default function formatDate(isoDate) {
	const date = new Date(isoDate);

	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const monthIndex = date.getMonth();
	const monthName = monthNames[monthIndex];

	const day = date.getDate();
	
	const formattedDate = `${monthName} ${day} ${date.getFullYear()}`;

	return formattedDate;
}