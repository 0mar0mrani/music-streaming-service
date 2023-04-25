import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';

import schemas from './schemas/schemas.js';
import main from './structure/main.js';

export default {
	title: 'Studio',

	projectId: 'scckrbbt',
	dataset: 'production',

	plugins: [
		deskTool({
			title: 'Main',
			name: 'main',
			structure: main,
		}), 
		
		visionTool()
	],

	schema: {
		types: schemas,
	},
};