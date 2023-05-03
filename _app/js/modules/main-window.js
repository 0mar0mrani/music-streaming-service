import { sanity } from '../sanity.js'
import formatDate from '../util/format-date.js';
import formatPlays from '../util/format-plays.js';
import formatSeconds from '../util/format-seconds.js';
import playerModule from './player.js';

export default async function mainWindow() {
	let errorMessage = '';
	let releases = await fetchAllReleases();

	const player = playerModule(releases);

	const mainWindow = document.querySelector('.main-window');
	let songsEl = null;

	function handleSongElClick(event) {
		const clickedTrackNumber = event.currentTarget.dataset.trackNumber;
		const clickedReleaseNumber = event.currentTarget.closest('.release').dataset.releaseNumber;

		player.setCurrentTrack(clickedTrackNumber);
		player.setCurrentRelease(clickedReleaseNumber);
		player.setQue();
		player.loadTrackFromQue();
		player.toggleIsPlaying(true);
		player.renderAudio();
		renderHTML();
	}

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
		const isError = typeof fetchedReleases !== 'string';
		
		if (isError) {
			return fetchedReleases;
		} else {
			errorMessage = fetchedReleases;
			return [];
		}
   }

	renderHTML();

	function reduceTotalPlayTimeOfTracks(tracks) {
		const totalSeconds = tracks.reduce((accumulator, track) => {
			return accumulator + track.playTime.minutes * 60 + track.playTime.seconds
		}, 0)

		return totalSeconds;
	}

	function renderHTML() {
		player.renderHTML();

		mainWindow.innerHTML = '';

		if (errorMessage) {
			const container = document.createElement('div');
			const message = document.createElement('div');

			message.innerText = errorMessage;

			container.className = 'error';
			message.className = 'error__message';

			container.append(message);
			mainWindow.append(container)
		} else {
			releases.forEach((release, index) => {
				const container = document.createElement('div');
				const releaseContainer = createReleaseDOM();
				const songHeaderContainer = createSongHeader();
				const songsContainer = createSongsDOM();
	
				container.dataset.releaseNumber = index;
				
				container.className = 'release';
				songsContainer.className = 'release__songs';
				
				container.append(releaseContainer);
				container.append(songHeaderContainer);
				container.append(songsContainer);
	
				function createSongHeader() {
					const songHeaderContainer = document.createElement('div');
					const number = document.createElement('div');
					const title = document.createElement('div');
					const plays = document.createElement('div');
					const time = document.createElement('div');
	
					songHeaderContainer.className = 'release__song-header';
	
					number.innerText = '#';
					title.innerText = 'title';
					plays.innerText = 'plays';
					time.innerText = 'time';
	
					songHeaderContainer.append(number);
					songHeaderContainer.append(title);
					songHeaderContainer.append(plays);
					songHeaderContainer.append(time);
	
					return songHeaderContainer;
				}
	
				function createReleaseDOM() {
					const totalSecondsOfRelease = reduceTotalPlayTimeOfTracks(release.tracks)
	
					const releaseContainer = document.createElement('div');
					const artworkContainer = document.createElement('div');
					const artwork = document.createElement('img');
					const metaDataContainer = document.createElement('div');
					const title = document.createElement('div');
					const artist = document.createElement('div');
					const releaseType = document.createElement('div');
					const moreMetaDataContainer = document.createElement('div');
					const releaseDate = document.createElement('div');
					const amountOfSongs = document.createElement('div');
					const playTime = document.createElement('div');
	
					artwork.src = release.tracks[0].artworkURL;
					artwork.alt = release.tracks[0].artworkAlt;
	
					title.innerText = release.title;
					artist.innerText = release.artists.join(', ');
					releaseType.innerText = release.type;
					releaseDate.innerText = formatDate(release.releaseDate);
					amountOfSongs.innerText = `${release.tracks.length} songs`;
					playTime.innerText = formatSeconds(totalSecondsOfRelease);
	
					releaseContainer.className = 'release__release-container';
					metaDataContainer.className = 'release__meta-data-container';
					moreMetaDataContainer.className = 'release__more-meta-data-container';
					artworkContainer.className = 'release__artwork'; 
					title.className = 'release__title';
					artist.className = 'release__artist';
					releaseType.className = 'release__type';
	
					artworkContainer.append(artwork);
					releaseContainer.append(artworkContainer);
	
					moreMetaDataContainer.append(releaseDate);
					moreMetaDataContainer.append(amountOfSongs);
					moreMetaDataContainer.append(playTime);
	
					metaDataContainer.append(title);
					metaDataContainer.append(artist);
					metaDataContainer.append(releaseType);
					metaDataContainer.append(moreMetaDataContainer);
	
					releaseContainer.append(metaDataContainer);
	
					return releaseContainer;
				}
	
				function createSongsDOM() {
					const songsContainer = document.createElement('div');
		
					release.tracks.forEach((track, index) => {
						const formattedPlaytime = `${track.playTime.minutes.toString().padStart(2, '0')}:${track.playTime.seconds.toString().padStart(2, '0')}`;
						const formattedPlays = formatPlays(String(track.plays));
	
						const songContainer = document.createElement('button');
						const number = document.createElement('div');
						const titleArtistContainer = document.createElement('div');
						const title = document.createElement('div');
						const artist = document.createElement('div');
						const plays = document.createElement('div');
						const time = document.createElement('div');
	
						songContainer.dataset.trackNumber = index;
	
						number.innerText = index + 1;
						title.innerText = track.title;
						artist.innerText = track.artists.join(', ');
						plays.innerText = formattedPlays;
						time.innerText = formattedPlaytime;
	
						songContainer.className = 'release__song';
						number.className = 'release__number';
						title.className = 'release__track-title';
	
						titleArtistContainer.append(title);
						titleArtistContainer.append(artist);
	
						songContainer.append(number);
						songContainer.append(titleArtistContainer);
						songContainer.append(plays);
						songContainer.append(time);
	
						songsContainer.append(songContainer);
					});
	
					return songsContainer;
				}
	
				mainWindow.append(container);
			});
		}

		songsEl = document.querySelectorAll('.release__song');

		for (const songEl of songsEl) {
			songEl.addEventListener('dblclick', handleSongElClick);
		}
	}
}