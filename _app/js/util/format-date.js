export default function formatDate(string) {
	const date = new Date(string);

	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const monthIndex = date.getMonth();
	const monthName = monthNames[monthIndex];

	const day = date.getDate();
	const formattedDate = `${monthName} ${day} ${date.getFullYear()}`;

	return formattedDate;
}