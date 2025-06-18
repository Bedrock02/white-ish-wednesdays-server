const SpotifyWebApi = require('spotify-web-api-node');

require('dotenv').config();
const clientID = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;


// credentials are optional
const spotifyApi = new SpotifyWebApi({
  clientId: clientID,
  clientSecret: clientSecret,
  redirectUri: 'http://localhost:3000/callback'
});