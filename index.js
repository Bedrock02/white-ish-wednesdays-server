const express = require('express');
const { urlencoded } = require('body-parser');
const { Pool } = require('pg');
const asyncHandler = require('express-async-handler')
const request = require("request");
const MessagingResponse = require('twilio').twiml.MessagingResponse;


const app = express();
app.use(urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


require('dotenv').config();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const players = process.env.PLAYERS.split(' ');

const triggerDeploy = () => {
  const options = {
    method: "POST",
    url: process.env.VERCEL_HOOK_URL,
    headers: {
      "Content-type": "application/json",
    },
  };

  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.statusCode);
  });
};


app.use(express.json());

app.post('/new-game', asyncHandler(async (req, res, next) => {
  const jsonData = req.body;
  console.log("Players", players);
  const { player, spotify_link } = jsonData;
  console.log("Player", player);
  console.log("Spotify Link", spotify_link);
  if (!players.includes(player)) {
    res.status(400).send('Invalid player');
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('INSERT INTO games (name, link) VALUES ($1, $2)', [player, spotify_link]);
    triggerDeploy();
    res.status(200).send('Game created, and deploy triggered');
  } catch (err) {
    res.status(500).send('Error creating game' + err);
  }
}));

app.get('/form', (req, res) => {
  res.render('form');
});

app.get('/', (req, res) => {
  res.send('Up and running!')
});

app.listen(port, () => {
  console.log('Esample listening on port')
});
