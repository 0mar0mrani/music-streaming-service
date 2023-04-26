export default Structure => {
	const { list, documentTypeListItem, divider, showIcons } = Structure;

	return list().title('Main').showIcons(false).items([
		documentTypeListItem('artist'),

		divider(),

		documentTypeListItem('track'),

		documentTypeListItem('release'),
	])
}