export default {
	title: 'Playlist',
	name: 'playlist',
	type: 'document',
	fields: [ 
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: Rule => Rule.required(),
		}, 
		{
			title: 'Songs',
			name: 'songs',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						{
							title: 'Release',
							name: 'release',
							type: 'reference',
							to: [{ type:'release'}],
							validation: Rule => Rule.required(),
						},
						{
							title: 'Track',
							name: 'track',
							type: 'reference',
							to: [{ type:'track'}],
							validation: Rule => Rule.required(),
						}
					]
				}
			],
			validation: Rule => Rule.required(),
		}
	]
}