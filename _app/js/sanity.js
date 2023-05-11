import { SanityClient } from './util/sanity-client.js';
import { sanityToken } from './env.js';

export const sanity = SanityClient({
   id: 'scckrbbt',
   dataset: 'production',
   version: '2023-03-01',
	token: sanityToken,
});