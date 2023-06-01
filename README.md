# Music Streaming Service
This is a music streaming service app with a modern and simple design. The application is built from the ground up with HTML, CSS and JS with Sanity as the backend where all data is stored. 

See live demo [here](https://music-streaming-service.netlify.app).

## Features
### Releases
- Browse through and listen to releases. 
- Get info about the release such as:
	- Title/artist
	- Release type: single/ep/album
	- Amount of songs
	- Play time/total playtime
	- Plays (counts as a play when you listen to the song)
- Add songs to playlists with right click or menu button.
- Fetches more releases when scrolling downwards. 

### Playlists
- Brows through and listen to playlists. 
- Create and name playlists
- Delete songs and playlists with right click or context menu button
- Get info about the playlist such as: 
	- Title/artist
	- Amount of songs
	- Play time/total playtime
	- Which album the song is from

### Player 
- All the necessary functionality: 
	- Play/pause 
	- Next/previous
	- Shuffle: randomize que
	- Repeat: plays the same song
	- Volume: change volume 
	- Timeline: scrubbing

- Mobile layout features a simplified player with the option to access additional controls through an elaborate animation using keyframes. To close this you can use the close button as well as dragging down (only touch input). See animation [here](https://youtube.com/shorts/vfKXl8rL3xQ?feature=share).

### Responsivity 
- The app is fully responsive and is possible to use with everything from a phone to a desktop. 

### Accessibility
- The app is created with accessibility in mind:
	- Loading animation
	- Possible to navigate whole application with keyboard
	- Close context menu and player with 'Escape'
	- Focuses on context menu items when opened and reverts focus to the original element upon closure
	- Icons have a descriptive alt text
	- Go directly to main content or controllers (if player is open)
	- When mobile player is open, focus is restricted to its elements, allowing interaction only within the player until it is closed

### Sanity
The approach regarding schemas was to have two schemas for a release: 'Track' and 'Release'. This decision was made because a song can be included in multiple releases, such as a single release followed by inclusion in a greatest hits album, while still remaining the same song. This approach ensures better data organization and management.

### Disclaimers
### API key
I have implemented a token-based authentication method to post to Sanity. Although the token is stored in a separate file named env.js, which is not uploaded to GitHub, it should be noted that this method is not secure as the token will be exposed in source code when user access the application. In the real word is this very bad practice, but is done to make the application full worthy with possibility to have playlists, edit and store them in Sanity. This was the most feasible solution to achieve the desired functionality, with the guidelines and restriction I had for this project.

#### Royalty free music
The songs are taken from [Pixbay](https://pixabay.com/no/music/) and is royalty free and artwork is ai-generated. 
