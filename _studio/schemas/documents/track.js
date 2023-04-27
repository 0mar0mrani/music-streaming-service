export default {
	title: 'Track',
	name: 'track',
	type: 'document',
	fields: [ 
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
					to: [{ type:'artist'}],
				}
			],
			description: 'Add all artist(s) preforming on this track.',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Audio File',
			name: 'audioFile',
			type: 'file',
			validation: Rule => Rule.required(),
		},
		{
			title: 'ISRC',
			name: 'isrc',
			type: 'string',
			description: 'The International Standard Recording Code (ISRC) is an international standard code for uniquely identifying sound recordings and music video recordings.',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Play Time',
			name: 'playTime',
			type: 'object',
			fields: [
				{
					title: 'Minutes',
					name: 'minutes',
					type: 'number',
				},
				{
					title: 'Seconds',
					name: 'seconds',
					type: 'number',
				}
			],
			
			options: {
				columns: 2,
			},

			validation: Rule => Rule.required(),
		},
		{
			title: 'Plays',
			name: 'plays',
			type: 'number',
		},
	],

	initialValue: {
		plays: 0,
	},

	preview: {
		select: {
			title: 'title',
			isrc: 'isrc',
			artist0: 'artists.0.name',
			artist1: 'artists.1.name',
			artist2: 'artists.2.name',
		},

		prepare: fields => {
			const { title, isrc, artist0, artist1, artist2} = fields;
			const authors = [artist0, artist1, artist2].filter(Boolean)
			
			return {
				title: `${title} - ${authors.join(', ')}`,
				subtitle: `ISRC: ${isrc}`
			}
		}
	}
}