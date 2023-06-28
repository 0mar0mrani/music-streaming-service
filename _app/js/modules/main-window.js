import { sanity } from '../sanity.js'

import formatDate from '../util/format-date.js';
import formatPlays from '../util/format-plays.js';
import formatSeconds from '../util/format-seconds-to-time.js';
import formatTimeToSeconds from '../util/format-time-to-seconds.js';
import formatTimeToSeconds2 from '../util/format-time-to-seconds-2.js';

import playerModule from './player.js';
import contextMenuModule from './context-menu.js';
import headerModule from './header.js';

export default async function mainWindow() {
	let releases = [];
	let playlists = [];
	let isLoading = false;

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

	// state for release section
	const release = {
		currentPage: 0,
		pageSize: 5,
		canFetch: true,
		scrolledToBottom: false,
	}

	const player = playerModule();
	const contextMenu = contextMenuModule();
	const header = headerModule();

	const mainWindowContainer = document.querySelector('.main-window-container');
	const mainWindowElement = document.querySelector('.main-window');
	const navigationButtonElements = document.querySelectorAll('.navigation__button');
	const createPlaylistButton = document.querySelector('.header__create-playlist-button');
	const loadingElement = document.querySelector('.loading');
	let contextMenuButtons = null;
	let contextMenuPlaylistButtons = null;
	const contextMenuDeletePlaylistButton = document.querySelector('.context-menu__button--delete-playlist');
	const contextMenuDeleteSongButton = document.querySelector('.context-menu__button--remove-song');
	let genericElements = null; // Created to make context menu work correctly
	let songButtons = null;
	let playlistHeaderElements = null;
	let playlistTitleInputs = null;
	
	window.addEventListener('contextmenu', handleWindowContextmenu);
	window.addEventListener('click', handleWindowClick);
	mainWindowContainer.addEventListener('scroll', handleMainWindowContainerScroll);
	for(const navigationButtonElement of navigationButtonElements) {
		navigationButtonElement.addEventListener('click', handleNavigationButtonElementClick);
	}
	createPlaylistButton.addEventListener('click', handleCreatePlaylistButtonClick);
	contextMenuDeletePlaylistButton.addEventListener('click', handleContextMenuDeletePlaylistButtonClick);
	contextMenuDeleteSongButton.addEventListener('click', handleContextMenuDeleteSongButtonClick);

	onLoad();
	
	function handleWindowContextmenu(event) {
		event.preventDefault();
		contextMenu.setIsOpen(false);
		renderHTML();
	}

	function handleWindowClick() {
		contextMenu.setIsOpen(false);
		renderHTML();
	}

	/**
	 * This handles the scrolling of the main window container, it fetches more releases when one screen height left, 'canFetch === true' and 'scrolledToBottom === false'.
	 * HTML is rendered two times to display loading to user.
	 * setTimeout is used to disable fetching in 0.5s, so it won't fetch multiple times. 
	 */
	async function handleMainWindowContainerScroll() {
		if (current.section === 'release') {
			const scrollCoordinatesFromBottom = window.innerHeight + mainWindowContainer.scrollTop;
			const mainWindowContainerHeight = mainWindowContainer.scrollHeight;
			const shouldFetchMoreReleases = release.canFetch && !release.scrolledToBottom && (scrollCoordinatesFromBottom >= mainWindowContainerHeight - window.innerHeight);
			const fetchDisabledTime = 0.5 * 1000;
	
			if (shouldFetchMoreReleases) {
				release.canFetch = false;
				release.currentPage += 1;
				isLoading = true;
				renderHTML();
				const moreReleases = await fetchReleases();
				releases = [...releases, ...moreReleases];
				player.setReleases(releases);
				checkIfScrolledToBottom(moreReleases);
				isLoading = false;
				renderHTML();
	
				setTimeout(() => {
					release.canFetch = true;
				}, fetchDisabledTime);
			}
		}
	}

	function handleNavigationButtonElementClick(event) {
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
	
	function handleContextMenuButtonClick(event) {
		event.stopPropagation();

		const clickedButton = event.currentTarget;
		const clickedSongIndex = Number(clickedButton.closest('.song')?.dataset.id);
		const clickedSongGroupIndex = Number(clickedButton.closest('.song-group').dataset.id);
		const clickedButtonCoordinates = clickedButton.getBoundingClientRect();
		const isButtonInPlaylistHeader = clickedButton.classList.contains('playlist__menu-button');

		setCurrentSongAndSongGroup(clickedSongIndex, clickedSongGroupIndex);
		setClickedElement(isButtonInPlaylistHeader);
		contextMenu.setCoordinates(clickedButtonCoordinates.left, clickedButtonCoordinates.bottom);
		contextMenu.setIsOpen(true);
		renderHTML();
	}

	async function handleContextMenuButtonKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const pressedButton = event.currentTarget;
			pressedButton.click();

			contextMenu.setLastFocused({
				song: pressedButton.closest('.song')?.dataset.id,
				songGroup: pressedButton.closest('.song-group').dataset.id, 
			});
			
			focusOnFirstButtonInContextMenu(pressedButton);
		} 
	}

	function handleGenericElementClick() {
		contextMenu.setIsOpen(false);
		renderHTML();
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

	async function handleContextMenuDeletePlaylistButtonClick() {
		isLoading = true;
		renderHTML();
		await deletePlaylist(current.songGroup.id);
		playlists = await fetchPlaylists();
		isLoading = false;
		header.setIsMessageVisible(true);
		renderHTML();
	} 

	async function handleContextMenuDeleteSongButtonClick() {
		const playlistWithRemovedSong = removeSongFromPlaylist();
		const playlistForSanity = preparePlaylistForSanity(playlistWithRemovedSong);
		const playlistID = playlists[current.songGroup.index]._id;
		isLoading = true;
		renderHTML();
		await updatePlaylist(playlistID, playlistForSanity);
		playlists = await fetchPlaylists();
		isLoading = false;
		header.setIsMessageVisible(true);
		renderHTML();
	}

	function handleSongButtonClick(event) {
		event.stopPropagation();
		contextMenu.setIsOpen(false);
		const clickedSong = event.currentTarget.dataset.id;
		const clickedSongGroup = event.currentTarget.closest('.song-group').dataset.id;

		addOneToPlays(Number(clickedSong), Number(clickedSongGroup));
		player.setCurrentQueIndex(Number(clickedSong));
		player.setCurrentSongGroup(Number(clickedSongGroup));
		player.setQue();
		player.setShuffle();
		player.loadSongFromQue();
		player.toggleIsPlaying(true);
		player.renderAudio();
		renderHTML();
	}

	function handleSongButtonContextmenu(event) {
		event.preventDefault();
		event.stopPropagation();
		const clickedSongIndex = Number(event.currentTarget.dataset.id);
		const clickedSongGroupIndex = Number(event.currentTarget.closest('.song-group').dataset.id);
		setCurrentSongAndSongGroup(clickedSongIndex, clickedSongGroupIndex);

		contextMenu.setClickedElement('song');
		contextMenu.setIsOpen(true);
		contextMenu.setCoordinates(event.clientX, event.clientY);
		
		renderHTML();
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

	function handlePlaylistTitleInputClick(event) {
		event.stopPropagation();
	}

	async function handlePlaylistTitleInputBlur(event) {
		const clickedPlaylist = event.currentTarget.closest('.playlist').dataset.id;
		const playlistID = playlists[clickedPlaylist]._id;
		const newTitle = event.currentTarget.value;

		playlists[clickedPlaylist].title = newTitle;		
		await changePlaylistTitle(playlistID, newTitle);
		header.setIsMessageVisible(true);
	}

	function handlePlaylistTitleInputKeydown(event) {
		if (event.key === 'Enter') {
			event.currentTarget.blur();
		}
	}

	/**
	 * Fetches playlists with a GROQ query to Sanity.
	 * Also communicates error to user if sanity.fetch() returns a string.
	 * @returns {array} Array of playlist || empty array if 'isError === true'
	 */
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

	/**
	 * Fetches releases with a GROQ query to Sanity.
	 * Also communicates error to user if sanity.fetch() returns a string.
	 * @returns {array} Array of playlist || empty array if 'isError === true'
	 */
	async function fetchReleases() {
		// Calculate the start and end for a slice of releases
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

	/**
	 * Adds song to playlist in Sanity. It inserts the song at the end of songs array in playlist with key created by Data.now().
	 * Also communicates if successful or not, if sanity.fetch() returns a string it's an error.
	 */
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

	/**
	 * Creates a new playlist in Sanity.
	 * Also communicates if successful or not, if sanity.fetch() returns a string it's an error.
	 */
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
			header.setMessage('Playlist created');
		}
	}

	/**
	 * Deletes playlist in Sanity.
	 * Also communicates if successful or not, if sanity.fetch() returns a string it's an error.
	 */
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

	/**
	 * Updates playlist with new songs, this is used to delete a song.
	 * Also communicates error to user if sanity.fetch() returns a string.
	 */
	async function updatePlaylist(playlistID, newPlaylist) {
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

	/**
	 * Increases the plays count of a song in Sanity.
	 * @param {number} clickedSong - The index of the song in the clickedSongGroup
	 * @param {number} clickedSongGroup - The group of songs the clickedSong belongs to
	 */
	async function addOneToPlays(clickedSong, clickedSongGroup) {
		const song = current.section === 'release' 
			? releases[clickedSongGroup].tracks[clickedSong] 
			: playlists[clickedSongGroup].songs[clickedSong];
		
		const mutations = [{
			patch: {
				id: song.trackID,
				set: {
					plays: song.plays + 1,
				},
			}
		}];  
	
		await sanity.mutate(mutations);
	}

	/**
	 * Changes title of playlist in Sanity.
	 * Also communicates error to user if sanity.fetch() returns a string.
	 */
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

	/**
	 * Prepares playlist for Sanity with references, creating an object Sanity understands.  
	 */
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

	/**
	 * Checks if scrolled to bottom, meaning no more releases. If length is shorter than pageSize, means theres no more to fetch. 
	 * @param {array} moreReleases - An array of releases
	 */
	function checkIfScrolledToBottom(moreReleases) {
		release.scrolledToBottom = moreReleases.length === release.pageSize ? false : true;
	}

	/**
	 * Sets current song and song group.
	 * @param {number} clickedSongIndex - The index of the clicked song.
	 * @param {number} clickedSongGroupIndex - The index of the clicked song group.
	 */
	function setCurrentSongAndSongGroup(clickedSongIndex, clickedSongGroupIndex) {
		const songID = current.section === 'release'
			? releases[clickedSongGroupIndex].tracks[clickedSongIndex].trackID
			: playlists[clickedSongGroupIndex].songs[clickedSongIndex]?.trackID;
		
		const songGroupID = current.section === 'release' 
			? releases[clickedSongGroupIndex]._id
			: playlists[clickedSongGroupIndex]._id;

		current.song.id = songID;
		current.song.index = clickedSongIndex;
		current.songGroup.id = songGroupID;
		current.songGroup.index = clickedSongGroupIndex;
	}

	/**
	 * Sets the clicked element based on the current section and whether the button is in the playlist header.
	 * @param {boolean} isButtonInPlaylistHeader - Whether the button is in the playlist header
	 */
	function setClickedElement(isButtonInPlaylistHeader) {
		if (current.section === 'playlist' && isButtonInPlaylistHeader) {
			contextMenu.setClickedElement('playlist');
		} else {
			contextMenu.setClickedElement('song');
		}
	}

	/**
	 * Focuses on the first visible button in the context menu.
	 * @param {object} pressedButton - The button that was pressed to open the context menu.
	 */
	function focusOnFirstButtonInContextMenu(pressedButton) {
		const isPlaylistMenuPressed = pressedButton.classList.contains('playlist__menu-button');
		let buttonToFocus = null;

		if (current.section === 'release') {
			buttonToFocus = document.querySelector('.context-menu .context-menu__button--visible');		
		} else if (current.section === 'playlist') {
			if (isPlaylistMenuPressed) {
				buttonToFocus = document.querySelector('.context-menu__button--delete-playlist');
			} else {
				buttonToFocus = document.querySelector('.context-menu__button--remove-song');
			}
		}

		buttonToFocus.focus();	
	}

	/**
	 * Removes song from a playlist
	 * @returns {array} playlist of songs with one song removed
	 */
	function removeSongFromPlaylist() {
		const clickedSongGroup = current.songGroup.index;
		const rightPlaylist = playlists[clickedSongGroup];
		const playlistWithRemovedSong = rightPlaylist.songs.filter((song, index) => Number(current.song.index) !== index);
		return playlistWithRemovedSong;
	}

	/**
	 * All functions to run when page loads.
	 */
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

	/**
	 * This main function consist of subfunctions that renders the HTML based on the state of player. 
	 */
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
			setQueryselectorAndEventlistenerPlaylists();
		} 

		renderReachedBottomMessage();
		setQueryselectorAndEventlistener();

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

		/**
		 * This function renders everything in releases section. 
		 */
		function renderReleases() {
			releases.forEach((release, index) => {
				const container = createContainerDOM(index);
				const releaseHeader = createReleaseHeaderDOM(release);
				const songsHeader = createSongsHeaderDOM();
				const songs = createSongsDOM(release);
					
				container.append(releaseHeader);
				container.append(songsHeader);
				container.append(songs);

				mainWindowElement.append(container);
			});

			/**
			 * Creates release container. 
			 */
			function createContainerDOM(index) {
				const container = document.createElement('li');
				container.dataset.id = index;
				container.className = 'release song-group';
				return container;
			}

			/**
			 * Creates release header. 
			 */
			function createReleaseHeaderDOM(release) {
				const totalSecondsOfRelease = formatTimeToSeconds(release.tracks);

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
				metaDataContainer.className = 'release__meta-data-container generic-element';
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

			/**
			 * Creates release songs header. 
			 */
			function createSongsHeaderDOM() {
				const songsHeaderContainer = document.createElement('div');
				const number = document.createElement('div');
				const title = document.createElement('div');
				const plays = document.createElement('div');
				const time = document.createElement('div');

				songsHeaderContainer.className = 'release__songs-header generic-element';

				number.innerText = '#';
				title.innerText = 'title';
				plays.innerText = 'plays';
				time.innerText = 'time';

				number.className = 'release__header-number';
				plays.className = 'release__header-plays';
				time.className = 'release__header-time';

				songsHeaderContainer.append(number);
				songsHeaderContainer.append(title);
				songsHeaderContainer.append(plays);
				songsHeaderContainer.append(time);

				return songsHeaderContainer;
			}

			/**
			 * Creates release songs. 
			 */
			function createSongsDOM(release) {
				const songsContainer = document.createElement('ul');
	
				release.tracks.forEach((track, index) => {
					const formattedPlaytime = formatTimeToSeconds2(track.playTime.minutes * 60 + track.playTime.seconds);
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
					number.className = 'release__song-number';
					title.className = 'release__song-title';
					time.className = 'release__song-time';
					plays.className = 'release__song-plays';
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
		}

		/**
		 * This function renders everything in playlist section. 
		 */
		function renderPlaylists() {
			playlists.forEach((playlist, index) => {
				const isNoSongsInPlaylist = playlist.songs.length !== 0;

				const container = createContainerDOM(index);
				const header = createHeaderDOM(playlist);
				const songs = createSongsDOM(playlist);
				const noSongs = createNoSongsDOM();
				
				container.append(header);
				isNoSongsInPlaylist ? container.append(songs) : container.append(noSongs);
				mainWindowElement.append(container);
			}) 

			/**
			 * Creates playlist container. 
			 */
			function createContainerDOM(index) {
				const container = document.createElement('li');
				container.className = 'playlist song-group';
				container.dataset.id = index;
				return container;
			}

			/**
			 * Creates playlist header. 
			 */
			function createHeaderDOM(playlist) {
				const totalSecondsOfPlaylist = formatTimeToSeconds(playlist.songs);
				const isSongsInPlaylist = playlist.songs.length !== 0;

				const container = document.createElement('div');
				const info = document.createElement('div');
				const menuButton = document.createElement('button');
				const menuIcon = document.createElement('img');
				const title = document.createElement('h2');
				const titleInput = document.createElement('input');
				const additionalInfo = document.createElement('div');
				const songsAmount = document.createElement('div');
				const playTime = document.createElement('div');

				container.className = 'playlist__header generic-element';
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
			
			/**
			 * Creates playlist songs header and songs. 
			 */
			function createSongsDOM(playlist) {
				const container = document.createElement('div');
				const songsHeader = createSongsHeaderDOM();
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

			/**
			 * Creates playlist songs header. 
			 */
			function createSongsHeaderDOM() {
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

				songsHeader.className = 'playlist__songs-header generic-element';
				number.className = 'playlist__number';
				album.className = 'playlist__album';
				time.className = 'playlist__time';
				empty.className = 'playlist__empty';

				songsHeader.append(number);
				songsHeader.append(empty);
				songsHeader.append(title);
				songsHeader.append(album);
				songsHeader.append(time);

				return songsHeader;
			}

			/**
			 * Creates playlist songs. 
			 */
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
				number.className = 'playlist__song-number';
				artworkContainer.className = 'playlist__song-artwork';
				title.className = 'playlist__song-title';
				menu.className = 'playlist__song-menu context-menu-button';
				album.className = 'playlist__song-album';
				time.className = 'playlist__song-time';

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
				songButton.append(menu);
				container.append(songButton);

				return container;
			}

			/**
			 * Creates playlist no song message. 
			 */
			function createNoSongsDOM() {
				const noSongs = document.createElement('div')
				noSongs.className = 'playlist__no-songs';
				noSongs.innerText = 'No songs in playlist';
				return noSongs;
			}
		}

		/**
		 * Renders reached bottom message. 
		 */
		function renderReachedBottomMessage() {
			if (current.section === 'release' && release.scrolledToBottom) {
				const message = document.createElement('div');
				message.innerText = `You've reached bottom`;
				message.className = 'main-window__reached-bottom';
				mainWindowElement.append(message);
			}
		}

		
		/**
		 * Adds Query selectors and event listeners for both release and playlist section.
		 */
		function setQueryselectorAndEventlistener() {
			songButtons = document.querySelectorAll('.song');
			contextMenuPlaylistButtons = document.querySelectorAll('.context-menu__button--add-playlist');
			contextMenuButtons = document.querySelectorAll('.context-menu-button');
			genericElements = document.querySelectorAll('.generic-element');

			for (const songButton of songButtons) {
				songButton.addEventListener('click', handleSongButtonClick);
				songButton.addEventListener('contextmenu', handleSongButtonContextmenu);
			}

			for (const contextMenuPlaylistButton of contextMenuPlaylistButtons) {
				contextMenuPlaylistButton.addEventListener('click', handleContextMenuPlaylistButtonClick);
			}

			for (const contextMenuButton of contextMenuButtons) {
				contextMenuButton.addEventListener('click', handleContextMenuButtonClick);
				contextMenuButton.addEventListener('keydown', handleContextMenuButtonKeydown);
			}	

			for (const genericElement of genericElements) {
				genericElement.addEventListener('click', handleGenericElementClick);
			}
		}

		/**
		 * Adds Query selectors and event listeners for playlist section.
		 */
		function setQueryselectorAndEventlistenerPlaylists() {
			playlistHeaderElements = document.querySelectorAll('.playlist__header');
			playlistTitleInputs = document.querySelectorAll('.playlist__title-input');

			for (const playlistHeaderElement of playlistHeaderElements) {
				playlistHeaderElement.addEventListener('contextmenu', handlePlaylistHeaderElementContextmenu);
			}
			
			for (const playlistTitleInput of playlistTitleInputs) {
				playlistTitleInput.addEventListener('click', handlePlaylistTitleInputClick);
				playlistTitleInput.addEventListener('blur', handlePlaylistTitleInputBlur);
				playlistTitleInput.addEventListener('keydown', handlePlaylistTitleInputKeydown);
			}
		}
	}
}