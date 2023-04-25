export default {
	title: 'Release',
	name: 'release',
	type: 'document',
	fields: [
		{
			title: 'Type',
			name: 'type',
			type: 'string',
			options: {
				list: [
					'Single',
					'EP',
					'Album',
				]
			},
			validation: Rule => Rule.required(),
		},
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Artists',
			name: 'artists',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type:'artist'}]
				}
			],
			description: 'Add only main artist(s) that preforms on every track of this release',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Artwork',
			name: 'artwork',
			type: 'image',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Artwork Alternative Text',
			name: 'artworkAlt',
			type: 'string',
			description: 'This is what screen reader reads when looking at artwork',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Release date',
			name: 'releaseDate',
			type: 'date',
			options: {
				dateFormat: 'DD-MMM-YYYY'
			},
			validation: Rule => Rule.required(),
		},
		{
			title: 'Tracks',
			name: 'tracks',
			type: 'array',
			of: [
				{
					type: 'reference',
					to: [{type:'track'}]
				}
			],
			validation: Rule => Rule.required(),
		},
	],

	preview: {
		select: {
			title: 'title',
			type: 'type',
			artwork: 'artwork',
			artist0: 'artists.0.name',
		},

		prepare: fields => {
			const { title, type, artwork, artist0 } = fields;
			
			return {
				title: `${title} - ${artist0}`,
				subtitle: type,
				media: artwork,
			}
		}
	}
}