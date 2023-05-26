import { sanity } from '../sanity.js'

import formatDate from '../util/format-date.js';
import formatPlays from '../util/format-plays.js';
import formatSeconds from '../util/format-seconds-to-time.js';
import formatTimeToSeconds from '../util/format-time-to-seconds.js';

import playerModule from './player.js';
import contextMenuModule from './context-menu.js';
import headerModule from './header.js';

export default async function mainWindow() {
	let releases = [];
	let playlists = [];
	let isLoading = false;

	const release = {
		currentPage: 0,
		pageSize: 5,
		canFetch: true,
		scrolledToBottom: false,
	}

	const current = {
		section: 'release',
		song: {
			id: null,
			index: null,
		},
		songGroup: {
			id: null,
			index: null,
		},
	}

	const player = playerModule();
	let contextMenu = contextMenuModule();
	const header = headerModule();

	const mainWindowContainer = document.querySelector('.main-window-container');
	const mainWindowElement = document.querySelector('.main-window');
	const loadingElement = document.querySelector('.loading');

	const navigationButtonElements = document.querySelectorAll('.navigation__button');
	const createPlaylistButton = document.querySelector('.header__add-playlist-button');

	let contextMenuAddToPlaylistButtons = null;
	let contextMenuPlaylistButtons = null;
	const deletePlaylistButton = document.querySelector('.context-menu__button--delete-playlist');
	const deleteSongButton = document.querySelector('.context-menu__button--remove-song');
	
	let songButtons = null;

	let playlistElements = null;
	let playlistHeaderElements = null;
	let playlistTitleInputs = null;
	
	mainWindowContainer.addEventListener('scroll', handleMainWindowContainerScroll);
	window.addEventListener('contextmenu', handleWindowContextmenu);
	window.addEventListener('click', handleWindowClick);
	createPlaylistButton.addEventListener('click', handleCreatePlaylistButtonClick);
	deletePlaylistButton.addEventListener('click', handleDeletePlaylistButtonClick);
	deleteSongButton.addEventListener('click', handleDeleteSongButtonClick);

	for(const navigationButtonElement of navigationButtonElements) {
		navigationButtonElement.addEventListener('click', handleNavigationButtonElementClick);
	}
	
	function handleWindowContextmenu(event) {
		event.preventDefault();
		contextMenu.setIsOpen(false);
		renderHTML();
	}

	function handleWindowClick(event) {
		contextMenu.setIsOpen(false);
		renderHTML();
	}

	function handleSongButtonClick(event) {
		event.stopPropagation();

		const clickedSong = event.currentTarget.dataset.id;
		const clickedSongGroup = event.currentTarget.closest('.song-group').dataset.id;

		const song = current.section === 'release' 
			? releases[clickedSongGroup].tracks[clickedSong] 
			: playlists[clickedSongGroup].songs[clickedSong];

		addOneToPlays(song.trackID, song.plays + 1);
		player.setCurrentSong(clickedSong);
		player.setCurrentSongGroup(clickedSongGroup);
		player.setQue();
		player.loadSongFromQue();
		player.toggleIsPlaying(true);
		player.renderAudio();
		renderHTML();
	}

	function handleSongButtonContextmenu(event) {
		event.preventDefault();
		event.stopPropagation();
		const clickedSong = event.currentTarget.dataset.id;
		const songGroup = event.currentTarget.closest('.song-group').dataset.id;
		const releaseID = current.section === 'release' 
			? releases[songGroup]._id
			: playlists[songGroup]._id;

		const trackID = current.section === 'release'
			? releases[songGroup].tracks[clickedSong].trackID
			: playlists[songGroup].songs[clickedSong].trackID;

		current.song.id = trackID;
		current.song.index = Number(clickedSong);
		current.songGroup.id = releaseID;
		current.songGroup.index = Number(songGroup);

		contextMenu.setClickedElement('song');
		contextMenu.setIsOpen(true);
		contextMenu.setCoordinates(event.clientX, event.clientY);

		renderHTML();
	}

	async function handleMainWindowContainerScroll() {
		const scrollCoordinatesFromBottom = window.innerHeight + mainWindowContainer.scrollTop;
		const mainWindowHeight = mainWindowContainer.scrollHeight;

		if (release.canFetch && !release.scrolledToBottom && (scrollCoordinatesFromBottom >= mainWindowHeight - window.innerHeight)) {
			release.canFetch = false;
			release.currentPage += 1;
			isLoading = true;
			renderHTML();
			const moreReleases = await fetchReleases();
			release.scrolledToBottom = moreReleases.length === release.pageSize ? false : true;
			releases = [...releases, ...moreReleases];
			player.setReleases(releases);
			isLoading = false;
			renderHTML();

			setTimeout(() => {
				release.canFetch = true;
			}, 500);
		}
	}

	async function handleNavigationButtonElementClick(event) {
		const clickedButtonName = event.currentTarget.querySelector('span').innerText.toLowerCase();
		current.section = clickedButtonName;
		player.setCurrentSection(current.section);
		player.setReleases(releases);
		player.setPlaylist(playlists);
		contextMenu.setCurrentSection(current.section);
		contextMenu.setPlaylists(playlists);
		header.setCurrentSection(current.section);
		renderHTML();
	}

	async function handleCreatePlaylistButtonClick() {
		isLoading = true;
		renderHTML();
		await createNewPlaylist();
		playlists = await fetchPlaylists(); 
		isLoading = false;
		header.setIsMessageVisible(true);
		renderHTML();
	}

	function handlePlaylistTitleInputClick(event) {
		event.stopPropagation();
	}

	async function handlePlaylistTitleInputBlur(event) {
		const clickedPlaylist = event.currentTarget.closest('.playlist').dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		const newTitle = event.currentTarget.value;
		
		await changePlaylistTitle(playlistID, newTitle);
		header.setIsMessageVisible(true);
		renderHTML();
	}

	function handlePlaylistTitleInputKeydown(event) {
		if (event.key === 'Enter') {
			event.currentTarget.blur();
		}
	}

	async function handleContextMenuPlaylistButtonClick(event) {
		const clickedPlaylist = event.currentTarget.dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		isLoading = true;
		renderHTML();
		await addSongToPlaylist(playlistID);
		playlists = await fetchPlaylists();
		header.setIsMessageVisible(true);
		isLoading = false;
		renderHTML();
	}

	function handleContextMenuAddToPlaylistButtonClick(event) {
		event.stopPropagation();

		const clickedButton = event.currentTarget;
		const pressedSongIndex = clickedButton.closest('.song')?.dataset.id;
		const pressedSongGroupIndex = clickedButton.closest('.song-group').dataset.id;
		const coordinates = clickedButton.getBoundingClientRect();
		const clickedOnPlaylistHeader = pressedSongIndex === undefined;
		
		if (current.section === 'release') {
			current.songGroup.id = releases[pressedSongGroupIndex]._id;
			current.song.id = releases[pressedSongGroupIndex].tracks[pressedSongIndex].trackID;
		} else if (current.section === 'playlist') {
			current.songGroup.index = pressedSongGroupIndex;
			current.song.index = pressedSongIndex

			if (clickedOnPlaylistHeader) {
				const playlistID = playlists[pressedSongGroupIndex]._id;
				current.songGroup.id = playlistID;
				contextMenu.setClickedElement('playlist');
			} else {
				contextMenu.setClickedElement('song');
			}
		}
		
		contextMenu.setCoordinates(coordinates.left, coordinates.bottom);
		contextMenu.setIsOpen(true);

		renderHTML();
	}

	async function handleContextMenuAddToPlaylistButtonKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const pressedButton = event.currentTarget;
			pressedButton.click();
			
			const lastFocusedElement = {
				song: pressedButton.closest('.song')?.dataset.id,
				songGroup: pressedButton.closest('.song-group').dataset.id, 
			}

			contextMenu.setLastFocused(lastFocusedElement);

			let buttonToFocus = null;
	
			if (current.section === 'release') {
				buttonToFocus = document.querySelector('.context-menu .context-menu__button--visible');		
			} else {
				buttonToFocus = document.querySelector('.context-menu__button--remove-song');
			}

			buttonToFocus.focus();	
		} 
	}

	function handlePlaylistHeaderElementContextmenu(event) {
		event.stopPropagation();
		event.preventDefault();
		contextMenu.setClickedElement('playlist');
		contextMenu.setCoordinates(event.clientX, event.clientY);
		contextMenu.setIsOpen(true);
		const clickedPlaylist = event.currentTarget.closest('.playlist').dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		current.songGroup.id = playlistID;
		renderHTML();
	}

	async function handleDeletePlaylistButtonClick() {
		isLoading = true;
		renderHTML();
		await deletePlaylist(current.songGroup.id);
		playlists = await fetchPlaylists();
		isLoading = false;
		header.setIsMessageVisible(true);
		renderHTML();
	} 

	async function handleDeleteSongButtonClick() {
		const clickedSongGroup = current.songGroup.index
		const rightPlaylist = playlists[clickedSongGroup];
		const playlistWithRemovedSong = rightPlaylist.songs.filter((song, index) => Number(current.song.index) !== index);
		const playlistForSanity = preparePlaylistForSanity(playlistWithRemovedSong);
		const playlistID = playlists[clickedSongGroup]._id;
		isLoading = true;
		renderHTML();
		await setPlaylist(playlistID, playlistForSanity);
		playlists = await fetchPlaylists();
		isLoading = false;
		header.setIsMessageVisible(true);
		renderHTML();
	}

	async function fetchPlaylists() {
      const query = `*[_type == 'playlist'] | order(_createdAt asc) {  
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

	async function fetchReleases() {
		const sliceStart = release.currentPage * release.pageSize;
		const sliceEnd = release.currentPage * release.pageSize + release.pageSize;

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
								_ref: current.song.id,
								_type: 'reference'
							},
							release: {
								_ref: current.songGroup.id,
								_type: 'reference'
							},
						}
					] 
				},
			}
		}];  

		const update = await sanity.mutate(mutations);
		const isError = typeof update === 'string';
		
		if (isError) {
			header.setMessage(update);
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

		const update = await sanity.mutate(mutations);
		const isError = typeof update === 'string';

		if (isError) {
			header.setMessage(update);
		} else {
			header.setMessage('Playlist created')
		}
	}

	async function deletePlaylist(id) {
		const mutations = [{
			delete: {
				id: id,
			}
		}];  

		const update = await sanity.mutate(mutations);
		const isError = typeof update === 'string';

		if (isError) {
			header.setMessage(update);
		}
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

		const update = await sanity.mutate(mutations);
		const isError = typeof update === 'string';

		if (isError) {
			header.setMessage(update);
		}
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

	async function changePlaylistTitle(playlistID, newTitle) {
		const mutations = [{
			patch: {
				id: playlistID,
				set: {
					title: newTitle,
				},
			}
		}];  

		const update = await sanity.mutate(mutations);
		const isError = typeof update === 'string';

		if (isError) {
			header.setMessage(update);
		}
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

	async function onLoad() {
		isLoading = true;
		renderHTML();
		[ releases, playlists ] = await Promise.all([ fetchReleases(), fetchPlaylists() ])
		header.setIsMessageVisible(true); 
		header.setCurrentSection(current.section);
		player.setCurrentSection(current.section);
		player.setReleases(releases);
		player.setPlaylist(playlists)
		contextMenu.setCurrentSection(current.section);
		contextMenu.setPlaylists(playlists);
		isLoading = false;
		renderHTML();
	}

	function renderHTML() {
		renderLoading();
		renderNavigationButtons();
		header.renderHTML();
		contextMenu.renderHTML();
		player.renderHTML();

		mainWindowElement.innerHTML = '';

		if (current.section === 'release') {
			renderReleases();
		} else if (current.section === 'playlist') {
			renderPlaylists();
			setQueryselectorAndEventlistenerPlaylist();
		} 

		setQueryselectorAndEventlistener();
		renderReachedBottomMessage();

		function renderReachedBottomMessage() {
			if (current.section === 'release' && release.scrolledToBottom) {
				const message = document.createElement('div');
				message.innerText = `You've reached bottom`;
				message.className = 'main-window__reached-bottom';
				mainWindowElement.append(message);
			}
		}

		function renderLoading() {
			isLoading ? loadingElement.classList.add('loading--active') : loadingElement.classList.remove('loading--active');
		}

		function renderNavigationButtons() {
			for (const navigationButtonElement of navigationButtonElements) {
				const buttonName = navigationButtonElement.querySelector('span').innerText.toLocaleLowerCase();

				navigationButtonElement.classList.remove('navigation__button--active');
				
				if (buttonName === current.section) {
					navigationButtonElement.classList.add('navigation__button--active');
				}
			}
		}

		function renderReleases() {
			releases.forEach((release, index) => {
				const container = createContainerDOM(index);
				const releaseHeader = createReleaseHeaderDOM();
				const songsHeader = createSongsHeaderDOM();
				const songs = createSongsDOM();
					
				container.append(releaseHeader);
				container.append(songsHeader);
				container.append(songs);

				function createContainerDOM(index) {
					const container = document.createElement('li');
					container.dataset.id = index;
					container.className = 'release song-group';
					return container;
				}

				function createReleaseHeaderDOM() {
					const totalSecondsOfRelease = formatTimeToSeconds(release.tracks)
	
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
	
				function createSongsHeaderDOM() {
					const songsHeaderContainer = document.createElement('div');
					const number = document.createElement('div');
					const title = document.createElement('div');
					const plays = document.createElement('div');
					const time = document.createElement('div');
	
					songsHeaderContainer.className = 'release__song-header';
	
					number.innerText = '#';
					title.innerText = 'title';
					plays.innerText = 'plays';
					time.innerText = 'time';

					number.className = 'release__header-number';
					plays.className = 'release__header-plays';
	
					songsHeaderContainer.append(number);
					songsHeaderContainer.append(title);
					songsHeaderContainer.append(plays);
					songsHeaderContainer.append(time);
	
					return songsHeaderContainer;
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
						const menu = document.createElement('button');
						const menuIcon = document.createElement('img');
	
						songButton.dataset.id = index;
	
						number.innerText = index + 1;
						title.innerText = track.title;
						artist.innerText = track.artists.join(', ');
						plays.innerText = formattedPlays;
						time.innerText = formattedPlaytime;
	
						songsContainer.className = 'release__songs';
						songButton.className = 'song release__song';
						number.className = 'release__number';
						title.className = 'release__track-title';
						plays.className = 'release__plays';
						menu.className = 'release__song-menu context-menu-button';

						songButton.dataset.id = index;

						menuIcon.src = '/_app/assets/svg/context.svg';
						menuIcon.alt = 'Open context menu';

						menu.append(menuIcon);
						titleArtistContainer.append(title);
						titleArtistContainer.append(artist);
						songButton.append(number);
						songButton.append(titleArtistContainer);
						songButton.append(plays);
						songButton.append(time);
						songButton.append(menu);
						songContainer.append(songButton);
						
						songsContainer.append(songContainer);
					});
	
					return songsContainer;
				}
	
				mainWindowElement.append(container);
			});
		}

		function renderPlaylists() {
			playlists.forEach((playlist, index) => {
				const isNoSongsInPlaylist = playlist.songs.length !== 0;
				const playlistContainer = document.createElement('li');
				playlistContainer.className = 'playlist song-group';
				playlistContainer.dataset.id = index;

				const header = createHeaderDOM(playlist);
				const songs = createSongsDOM(playlist);
				const noSongs = createNoSongs();
				
				playlistContainer.append(header);
				isNoSongsInPlaylist ? playlistContainer.append(songs) : playlistContainer.append(noSongs);
				mainWindowElement.append(playlistContainer);
			}) 

			function createHeaderDOM(playlist) {
				const totalSecondsOfPlaylist = formatTimeToSeconds(playlist.songs);
				const isSongsInPlaylist = playlist.songs.length !== 0;

				const container = document.createElement('div');
				const info = document.createElement('div');
				const menuButton = document.createElement('button');
				const menuIcon = document.createElement('img');
				const title = document.createElement('h2');
				const titleInput = document.createElement('input');
				const additionalInfo = document.createElement('div')
				const songsAmount = document.createElement('div');
				const playTime = document.createElement('div');

				container.className = 'playlist__header';
				info.className = 'playlist__info';
				title.className = 'playlist__title';
				titleInput.className = 'playlist__title-input';
				additionalInfo.className = 'playlist__additional-info';
				menuButton.className = 'playlist__menu-button context-menu-button';

				titleInput.value = playlist.title;
				songsAmount.innerText = `${playlist.songs.length} ${playlist.songs.length === 1 ? 'song' : 'songs'}`;
				playTime.innerText = formatSeconds(totalSecondsOfPlaylist);

				menuIcon.src = '/_app/assets/svg/context-vertical.svg';
				menuIcon.alt = 'Open playlist menu';

				menuButton.append(menuIcon);
				additionalInfo.append(songsAmount);
				additionalInfo.append(playTime);
				title.append(titleInput);
				info.append(title);
				isSongsInPlaylist && info.append(additionalInfo);
				container.append(info);
				container.append(menuButton);

				return container;
			}
			
			function createSongsDOM(playlist) {
				const container = document.createElement('div');
				const songsHeader = createSongsHeaderDOM(playlist);
				const songsContainer = document.createElement('ul');

				playlist.songs.forEach((song, index) => {
					const songContainer = createSongDOM(song, index); 
					songsContainer.append(songContainer);
				})

				container.className = 'playlist__songs-container';
				songsContainer.className = 'playlist__songs';
				
				container.append(songsHeader);
				container.append(songsContainer);

				return container;
			}

			function createSongsHeaderDOM(playlist) {
				const songsHeader = document.createElement('div');
				const number = document.createElement('div');
				const empty = document.createElement('div');
				const title = document.createElement('div');
				const album = document.createElement('div');
				const time = document.createElement('div');

				number.innerText = '#';
				title.innerText = 'Title';
				album.innerText = 'Album';
				time.innerText = 'Time';

				songsHeader.className = 'playlist__song-header';
				album.className = 'playlist__album-header';

				songsHeader.append(number);
				songsHeader.append(empty);
				songsHeader.append(title);
				songsHeader.append(album);
				songsHeader.append(time);

				return songsHeader;
			}

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
				const menu = document.createElement('button');
				const menuIcon = document.createElement('img');
				
				songButton.className = 'song playlist__song';
				number.className = 'playlist__number';
				artworkContainer.className = 'playlist__artwork';
				title.className = 'playlist__song-title';
				menu.className = 'playlist__song-menu context-menu-button';
				album.className = 'playlist__album';

				songButton.dataset.id = index;

				number.innerText = index + 1;
				title.innerText = song.title;
				artists.innerText = song.artists.join(', ');
				album.innerText = song.releaseTitle;
				time.innerText = `${song.playTime.minutes.toString().padStart(2, '0')}:${song.playTime.seconds.toString().padStart(2, '0')}`;
				
				artwork.src = song.artworkURL;
				menuIcon.src = '/_app/assets/svg/context.svg';

				artwork.alt = song.artworkAlt;
				menuIcon.alt = 'Open context menu';

				menu.append(menuIcon);
				artworkContainer.append(artwork);
				titleArtistContainer.append(title);
				titleArtistContainer.append(artists);
				songButton.append(number);
				songButton.append(artworkContainer);
				songButton.append(titleArtistContainer);
				songButton.append(album);
				songButton.append(time);
				songButton.append(menu)
				container.append(songButton);

				return container;
			}

			function createNoSongs() {
				const noSongs = document.createElement('div')
				noSongs.className = 'playlist__no-songs';
				noSongs.innerText = 'No songs in playlist';
				return noSongs;
			}
		}

		function setQueryselectorAndEventlistener() {
			songButtons = document.querySelectorAll('.song');
			contextMenuPlaylistButtons = document.querySelectorAll('.context-menu__button--add-playlist');
			contextMenuAddToPlaylistButtons = document.querySelectorAll('.context-menu-button');
			
			for (const songButton of songButtons) {
				songButton.addEventListener('click', handleSongButtonClick);
				songButton.addEventListener('contextmenu', handleSongButtonContextmenu);
			}

			for (const contextMenuPlaylistButton of contextMenuPlaylistButtons) {
				contextMenuPlaylistButton.addEventListener('click', handleContextMenuPlaylistButtonClick);
			}

			for (const contextMenuAddToPlaylistButton of contextMenuAddToPlaylistButtons) {
				contextMenuAddToPlaylistButton.addEventListener('click', handleContextMenuAddToPlaylistButtonClick);
				contextMenuAddToPlaylistButton.addEventListener('keydown', handleContextMenuAddToPlaylistButtonKeydown);
			}	
		}

		function setQueryselectorAndEventlistenerPlaylist() {
			playlistElements = document.querySelectorAll('.playlist');
			playlistHeaderElements = document.querySelectorAll('.playlist__header');
			playlistTitleInputs = document.querySelectorAll('.playlist__title-input');

			for (const playlistHeaderElement of playlistHeaderElements) {
				playlistHeaderElement.addEventListener('contextmenu', handlePlaylistHeaderElementContextmenu)
			}
			
			for (const playlistTitleInput of playlistTitleInputs) {
				playlistTitleInput.addEventListener('click', handlePlaylistTitleInputClick);
				playlistTitleInput.addEventListener('blur', handlePlaylistTitleInputBlur);
				playlistTitleInput.addEventListener('keydown', handlePlaylistTitleInputKeydown);
			}
		}
	}

	onLoad();
}