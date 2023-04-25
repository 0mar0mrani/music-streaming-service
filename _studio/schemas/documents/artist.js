export default {
	title: 'Artist',
	name: 'artist',
	type: 'document',
	fields: [
		{
			title: 'Name',
			name: 'name',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Image',
			name: 'image',
			type: 'image',
			validation: Rule => Rule.required(),
		},
		{
			title: 'About',
			name: 'about',
			type: 'text',
			validation: Rule => Rule.required(),
		},
	]
}