import { sanity } from '../sanity.js'
export default async function mainWindow() {
	let releases = await fetchAllReleases();


	async function fetchAllReleases() {
      const query = `*[_type == 'release'] | order(releaseDate desc) {
			_id,
         _type,
			type,
			title,
			releaseDate,
			'artists': artists[]->name,
         tracks[]-> {
				_id,
				title,
				plays,
				playTime,
				'artists': artists[]->name,
				'trackURL': audioFile.asset->.url,
				'artworkURL': ^.artwork.asset->.url,
				'artworkAlt': ^.artworkAlt,
			},
      }`;
      
      const fetchedReleases = await sanity.fetch(query);
      return fetchedReleases;
   }


}