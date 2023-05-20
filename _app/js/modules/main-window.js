import { sanity } from '../sanity.js'
import formatDate from '../util/format-date.js';
import formatPlays from '../util/format-plays.js';
import formatSeconds from '../util/format-seconds.js';
import playerModule from './player.js';
import playlistModule from './playlist.js';
import contextMenuModule from './context-menu.js';
import headerModule from './header.js';

export default async function mainWindow() {
	let currentSection = 'release';
	let errorMessage = '';
	let currentPage = 0;
	let pageSize = 5;
	let canFetch = true;
	let scrolledToBottom = false;
	let isLoading = false;

	const current = {
		track: null,
		release: null,
		playlistIndex: null,
		playlistSongIndex: null,
	}

	let releases = [];
	let playlists = [];

	const player = playerModule(currentSection, releases, playlists);
	let contextMenu = contextMenuModule(currentSection, playlists);
	const header = headerModule();

	const mainWindow = document.querySelector('.main-window-container');
	const loading = document.querySelector('.loading');
	let contextMenuPlaylistButtons = null;
	let songsEl = null;
	const navigationButtons = document.querySelectorAll('.navigation__button');
	let playlistElements = null;
	let playlistButtons = null;
	let playlistTitleInputs = null;
	const deletePlaylistButton = document.querySelector('.context-menu__button--delete-playlist');
	const removeSong = document.querySelector('.context-menu__button--remove-song');
	const createPlaylist = document.querySelector('.header__add-playlist-button');

	mainWindow.addEventListener('scroll', handleMainWindowScroll);
	window.addEventListener('contextmenu', handleWindowContextmenu);
	window.addEventListener('click', handleWindowClick);

	for(const navigationButton of navigationButtons) {
		navigationButton.addEventListener('click', handleNavigationButtonClick);
	}

	createPlaylist.addEventListener('click', handleCreatePlaylistClick);
	deletePlaylistButton.addEventListener('click', handleDeletePlaylistButtonClick);
	removeSong.addEventListener('click', handleRemoveSongClick);
	
	function handleWindowContextmenu(event) {
		event.preventDefault();
		contextMenu.setIsOpen(false);
		renderHTML();
	}

	function handleWindowClick(event) {
		contextMenu.setIsOpen(false);
		renderHTML();
	}

	function handleSongElClick(event) {
		event.stopPropagation();

		const clickedTrackNumber = event.currentTarget.dataset.id;
		const clickedReleaseNumber = event.currentTarget.closest('.song-group').dataset.id;

		const song = currentSection === 'release' 
			? releases[clickedReleaseNumber].tracks[clickedTrackNumber] 
			: playlists[clickedReleaseNumber].songs[clickedTrackNumber]

		addOneToPlays(song.trackID, song.plays + 1)
		player.setCurrentTrack(clickedTrackNumber);
		player.setCurrentRelease(clickedReleaseNumber);
		player.setQue();
		player.loadTrackFromQue();
		player.toggleIsPlaying(true);
		player.renderAudio();
		renderHTML();
	}

	function handleSongElContextmenu(event) {
		event.preventDefault();
		event.stopPropagation();
		const clickedSong = event.currentTarget.dataset.id;
		const songGroup = event.currentTarget.closest('.song-group').dataset.id;
		const releaseID = currentSection === 'release' 
			? releases[songGroup]._id
			: playlists[songGroup]._id

		const trackID = currentSection === 'release'
			? releases[songGroup].tracks[clickedSong].trackID
			: playlists[songGroup].songs[clickedSong].trackID

		current.track = trackID;
		current.release = releaseID;
		current.playlistSongIndex = Number(clickedSong);
		current.playlistIndex = Number(songGroup);

		contextMenu.setClickedElement('song');
		contextMenu.setIsOpen(true);
		contextMenu.setCoordinates(event);
		renderHTML();
	}

	async function handleMainWindowScroll() {
		const scrollCoordinatesFromBottom = window.innerHeight + mainWindow.scrollTop;
		const mainWindowHeight = mainWindow.scrollHeight;

		if (canFetch && !scrolledToBottom && (scrollCoordinatesFromBottom >= mainWindowHeight - window.innerHeight)) {
			canFetch = false;
			currentPage += 1;
			isLoading = true;
			renderHTML();
			const moreReleases = await fetchAllReleases();
			isLoading = false;
			scrolledToBottom = moreReleases.length === pageSize ? false : true;
			releases = [...releases, ...moreReleases];
			renderHTML();

			setTimeout(() => {
				canFetch = true;
			}, 500);
		}
	}

	async function handleNavigationButtonClick(event) {
		const clickedButtonName = event.currentTarget.querySelector('span').innerText.toLowerCase();
		currentSection = clickedButtonName;
		player.setCurrentSection(currentSection);
		player.setReleases(releases);
		player.setPlaylist(playlists);
		contextMenu.setCurrentSection(currentSection);
		contextMenu.setPlaylists(playlists);
		renderHTML();
	}

	async function handleCreatePlaylistClick() {
		isLoading = true;
		renderHTML();
		await createNewPlaylist();
		playlists = await fetchPlaylists(); 
		isLoading = false;
		renderHTML();
	}

	function handlePlaylistTitleInputClick(event) {
		event.stopPropagation();
	}

	function handlePlaylistTitleInputBlur(event) {
		const clickedPlaylist = event.currentTarget.closest('.playlist').dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		const newTitle = event.currentTarget.value;
		
		mutatePlaylistTitle(playlistID, newTitle);
	}

	function handlePlaylistTitleInputKeydown(event) {
		if (event.key === 'Enter') {
			event.currentTarget.blur();
		}
	}

	async function handleContextMenuPlaylistButtonClick(event) {
		const clickedPlaylist = event.currentTarget.dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		addSongToPlaylist(playlistID);
		playlists = await fetchPlaylists();
	}

	function handlePlaylistButtonContextmenu(event) {
		event.stopPropagation();
		event.preventDefault();
		contextMenu.setClickedElement('playlist')
		contextMenu.setCoordinates(event)
		contextMenu.setIsOpen(true);
		const clickedPlaylist = event.currentTarget.closest('.playlist').dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		current.playlist = playlistID;
		renderHTML();
	}

	async function handleDeletePlaylistButtonClick() {
		isLoading = true;
		renderHTML();
		await deletePlaylist(current.playlist);
		playlists = await fetchPlaylists();
		isLoading = false;
		renderHTML();
	} 

	async function handleRemoveSongClick() {
		const rightPlaylist = playlists[current.playlistIndex];
		const playlistWithRemovedSong = rightPlaylist.songs.filter((song, index) => current.playlistSongIndex !== index);
		const playlistForSanity = preparePlaylistForSanity(playlistWithRemovedSong);
		const playlistID = playlists[current.playlistIndex]._id;
		isLoading = true;
		renderHTML();
		await setPlaylist(playlistID, playlistForSanity);
		playlists = await fetchPlaylists();
		isLoading = false;
		renderHTML();
	}

	async function fetchPlaylists() {
      const query = `*[_type == 'playlist'] | order(releaseDate asc) {  
			_id,
			title,
			songs[] {
				'releaseTitle': release->title,
				'releaseID': release->_id,
				'trackID': track->_id,
				'plays': track->plays,
				'title': track->title,
				'artists': track->artists[]->name,
				'playTime': track->playTime,
				'trackURL': track->.audioFile.asset->url,
				'artworkURL': release->artwork.asset->url,
				'artworkAlt': release->artworkAlt,
			}
		}`;
		
		const fetchPlaylists = await sanity.fetch(query);
		const isError = typeof fetchPlaylists === 'string';
		
		if (isError) {
			header.setMessage(fetchPlaylists);
			return [];
		} else {
		return fetchPlaylists;
	}
	}

	async function fetchAllReleases() {
		const sliceStart = currentPage * pageSize;
		const sliceEnd = currentPage * pageSize + pageSize;

      const query = `*[_type == 'release' ] [${sliceStart}...${sliceEnd}] | order(releaseDate desc)  {
			_id,
         _type,
			type,
			title,
			releaseDate,
			'artists': artists[]->name,
         tracks[]-> {
				'trackID': _id,
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
		const isError = typeof fetchedReleases === 'string';
		
		if (isError) {
			header.setMessage(fetchedReleases);
			return [];
		} else {
			return fetchedReleases;
		}
   }

	async function addSongToPlaylist(playlistID) {
		const mutations = [{
			patch: {
				id: playlistID,
				insert: {
					after: 'songs[-1]',
					items: [
						{
							_key: Date.now(),
							track: {
								_ref: current.track,
								_type: 'reference'
							},
							release: {
								_ref: current.release,
								_type: 'reference'
							},
						}
					] 
				},
			}
		}];  

		const query = await sanity.mutate(mutations);
		const isError = typeof query === 'string';
		
		if (isError) {
			header.setMessage(query);
		} else {
			header.setMessage('Song added');
		}
	}

	async function createNewPlaylist() {
		const mutations = [{
			createOrReplace: {
				_type: 'playlist',
				title: `Playlist #${playlists.length + 1}`,
				songs: [],
			}
		}];  

		await sanity.mutate(mutations);
	}

	async function deletePlaylist(id) {
		const mutations = [{
			delete: {
				id: id,
			}
		}];  

		await sanity.mutate(mutations);
	}

	async function setPlaylist(playlistID, newPlaylist) {
		const mutations = [{
			patch: {
				id: playlistID,
				set: {
					songs: newPlaylist,
				},
			}
		}];  

		await sanity.mutate(mutations);
	}

	async function addOneToPlays(trackID, newPlays) {
		const mutations = [{
			patch: {
				id: trackID,
				set: {
					plays: newPlays,
				},
			}
		}];  
	
		await sanity.mutate(mutations);
	}

	async function mutatePlaylistTitle(playlistID, newTitle) {
		const mutations = [{
			patch: {
				id: playlistID,
				set: {
					title: newTitle,
				},
			}
		}];  

		await sanity.mutate(mutations);
	}

	function preparePlaylistForSanity(playlist) {
		return playlist.map((song, index) => {
			return {
				_key: Date.now() + index,
				track: {
					_ref: song.trackID,
					_type: 'reference'
				},
				release: {
					_ref: song.releaseID,
					_type: 'reference'
				},
			}
		});
	}

	function reduceTotalPlayTimeOfTracks(tracks) {
		const totalSeconds = tracks.reduce((accumulator, track) => {
			return accumulator + track.playTime.minutes * 60 + track.playTime.seconds
		}, 0)

		return totalSeconds;
	}

	async function onLoad() {
		isLoading = true;
		renderHTML();
		[ releases, playlists ] = await Promise.all([ fetchAllReleases(), fetchPlaylists() ]) 
		header.setIsVisible(true); 
		player.setCurrentSection(currentSection);
		player.setReleases(releases);
		player.setPlaylist(playlists)
		contextMenu.setCurrentSection(currentSection);
		contextMenu.setPlaylists(playlists);
		isLoading = false;
		renderHTML();
	}

	function renderHTML() {
		renderLoading();
		contextMenu.renderHTML();
		renderNavigationButtons();
		player.renderHTML();
		header.renderHTML();

		mainWindow.innerHTML = '';

			if (currentSection === 'release') {
				renderReleases();
			} else if (currentSection === 'playlist') {
				renderPlaylist();
				
				playlistElements = document.querySelectorAll('.playlist');
				playlistButtons = document.querySelectorAll('.playlist__button');
				playlistTitleInputs = document.querySelectorAll('.playlist__title-input');

				for (const playlistButton of playlistButtons) {
					playlistButton.addEventListener('contextmenu', handlePlaylistButtonContextmenu)
				}

				for (const playlistElement of playlistElements) {
					playlistModule(playlistElement);	
				}

				for (const playlistTitleInput of playlistTitleInputs) {
					playlistTitleInput.addEventListener('click', handlePlaylistTitleInputClick);
					playlistTitleInput.addEventListener('blur', handlePlaylistTitleInputBlur);
					playlistTitleInput.addEventListener('keydown', handlePlaylistTitleInputKeydown);
				}

				function renderPlaylist() {
					playlists.forEach((playlist, index) => {
						const playlistContainer = document.createElement('li');
						playlistContainer.className = 'playlist song-group';

						const button = createButtonDOM(playlist);
						const songs = createSongsDOM(playlist);

						playlistContainer.dataset.id = index;
						
						playlistContainer.append(button);
						playlistContainer.append(songs);
						
						mainWindow.append(playlistContainer);
					}) 

					function createButtonDOM(playlist) {
						const totalSecondsOfPlaylist = reduceTotalPlayTimeOfTracks(playlist.songs)

						const button = document.createElement('button');
						const info = document.createElement('div');
						const title = document.createElement('h2');
						const titleInput = document.createElement('input');
						const additionalInfo = document.createElement('div')
						const songAmount = document.createElement('div');
						const playlistPlayTime = document.createElement('div');
						const iconContainer = document.createElement('div');
						const icon = document.createElement('img');

						button.className = 'playlist__button';
						info.className = 'playlist__info';
						title.className = 'playlist__title';
						titleInput.className = 'playlist__title-input';
						additionalInfo.className = 'playlist__additional-info';
						iconContainer.className = 'playlist__icon';

						titleInput.value = playlist.title;
						songAmount.innerText = `${playlist.songs.length} ${playlist.songs.length === 1 ? 'song' : 'songs'}`;
						playlistPlayTime.innerText = formatSeconds(totalSecondsOfPlaylist);
						
						icon.src = '/_app/assets/svg/close.svg';
						icon.alt = 'close playlist'

						additionalInfo.append(songAmount);
						additionalInfo.append(playlistPlayTime);
						title.append(titleInput);
						info.append(title);
						info.append(additionalInfo);
						iconContainer.append(icon);
						button.append(info);
						button.append(iconContainer);

						return button;
					}
					

					function createSongsDOM(playlist) {
						const container = document.createElement('div');
						const header = document.createElement('div');
						const number = document.createElement('div');
						const empty = document.createElement('div');
						const title = document.createElement('div');
						const album = document.createElement('div');
						const time = document.createElement('div');

						const songsContainer = document.createElement('ul');

						playlist.songs.forEach((song, index) => {
							const songContainer = createSongDOM(song, index); 
							songsContainer.append(songContainer);
						})

						number.innerText = '#';
						title.innerText = 'Title';
						album.innerText = 'Album';
						time.innerText = 'Time';

						container.className = 'playlist__songs-container';
						header.className = 'playlist__song-header';
						songsContainer.className = 'playlist__songs';

						header.append(number);
						header.append(empty);
						header.append(title);
						header.append(album);
						header.append(time);
						container.append(header);
						container.append(songsContainer);

						return container;

						function createSongDOM(song, index) {
							const container = document.createElement('li');
							const songButton = document.createElement('button');
							const number = document.createElement('div');
							const artworkContainer = document.createElement('div');
							const artwork = document.createElement('img');
							const titleArtistContainer = document.createElement('div');
							const title = document.createElement('h3');
							const artists = document.createElement('div');
							const album = document.createElement('div');
							const time = document.createElement('div');

							songButton.className = 'song playlist__song';
							number.className = 'playlist__number';
							artworkContainer.className = 'playlist__artwork';
							title.className = 'playlist__song-title';

							songButton.dataset.id = index;

							number.innerText = index + 1;
							title.innerText = song.title;
							artists.innerText = song.artists.join(', ');
							album.innerText = song.releaseTitle;
							time.innerText = `${song.playTime.minutes.toString().padStart(2, '0')}:${song.playTime.seconds.toString().padStart(2, '0')}`;
							
							artwork.src = song.artworkURL;
							artwork.alt = song.artworkAlt;

							artworkContainer.append(artwork);
							titleArtistContainer.append(title);
							titleArtistContainer.append(artists);
							songButton.append(number);
							songButton.append(artworkContainer);
							songButton.append(titleArtistContainer);
							songButton.append(album);
							songButton.append(time);
							container.append(songButton);

							return container;
						}
					}
				}
			} else if (currentSection === 'search') {

			}

			if (scrolledToBottom) {
				const message = document.createElement('div');
				message.innerText = `You've reached bottom`;
				message.className = 'main-window__message';
				mainWindow.append(message);
		}

		songsEl = document.querySelectorAll('.song');

		for (const songEl of songsEl) {
			songEl.addEventListener('click', handleSongElClick);
			songEl.addEventListener('contextmenu', handleSongElContextmenu);
		}

		function renderLoading() {
			isLoading ? loading.classList.add('loading--active') : loading.classList.remove('loading--active');
		}

		function renderNavigationButtons() {
			for (const navigationButton of navigationButtons) {
				const buttonName = navigationButton.querySelector('span').innerText.toLocaleLowerCase();

				navigationButton.classList.remove('navigation__button--active');
				
				if (buttonName === currentSection) {
					navigationButton.classList.add('navigation__button--active');
				}
			}
		}

		function renderReleases() {
			releases.forEach((release, index) => {
				const container = document.createElement('li');
				const releaseContainer = createReleaseDOM();
				const songHeaderContainer = createSongHeader();
				const songsContainer = createSongsDOM();
	
				container.dataset.id = index;

				container.className = 'release song-group';
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

					number.className = 'release__header-number';
					plays.className = 'release__header-plays';
	
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
					const title = document.createElement('h2');
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
					amountOfSongs.innerText = `${release.tracks.length} ${release.tracks.length === 1 ? 'song' : 'songs'}`;
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
					const songsContainer = document.createElement('ul');
		
					release.tracks.forEach((track, index) => {
						const formattedPlaytime = `${track.playTime.minutes.toString().padStart(2, '0')}:${track.playTime.seconds.toString().padStart(2, '0')}`;
						const formattedPlays = formatPlays(String(track.plays));

						const songContainer = document.createElement('li');
						const songButton = document.createElement('button');
						const number = document.createElement('div');
						const titleArtistContainer = document.createElement('div');
						const title = document.createElement('h3');
						const artist = document.createElement('div');
						const plays = document.createElement('div');
						const time = document.createElement('div');
	
						songButton.dataset.id = index;
	
						number.innerText = index + 1;
						title.innerText = track.title;
						artist.innerText = track.artists.join(', ');
						plays.innerText = formattedPlays;
						time.innerText = formattedPlaytime;
	
						songButton.className = 'song release__song';
						number.className = 'release__number';
						title.className = 'release__track-title';
						plays.className = 'release__plays';

						songButton.dataset.id = index;
	
						titleArtistContainer.append(title);
						titleArtistContainer.append(artist);
	
						songButton.append(number);
						songButton.append(titleArtistContainer);
						songButton.append(plays);
						songButton.append(time);
	
						songContainer.append(songButton);

						songsContainer.append(songContainer);
					});
	
					return songsContainer;
				}
	
				mainWindow.append(container);
			});
		}

		contextMenuPlaylistButtons = document.querySelectorAll('.context-menu__button--add-playlist');
		for (const contextMenuPlaylistButton of contextMenuPlaylistButtons) {
			contextMenuPlaylistButton.addEventListener('click', handleContextMenuPlaylistButtonClick);
		}
	}

	onLoad();
}