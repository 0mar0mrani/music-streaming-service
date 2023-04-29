import { SanityClient } from './util/sanity-client.js';

export const sanity = SanityClient({
   id: 'scckrbbt',
   dataset: 'production',
   version: '2023-03-01'
});