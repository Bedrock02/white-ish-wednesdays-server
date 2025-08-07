const express = require('express');
const { urlencoded } = require('body-parser');
const { Pool } = require('pg');
const asyncHandler = require('express-async-handler')
const axios = require('axios');
const spotifyClient = require('./spotifyClient');

// Create the Express app outside the conditional
const app = express();
app.use(urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const players = process.env.PLAYERS ? process.env.PLAYERS.split(' ') : [];

// Function to get the Wednesday of this week
function getThisWeeksWednesday() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const wednesday = new Date(today.setDate(diff + 3));
    return wednesday;
}

const triggerDeploy = async (req, res) => {
  try {
    const vercelHookUrl = process.env.VERCEL_HOOK_URL;
    if (!vercelHookUrl) {
      throw new Error('VERCEL_HOOK_URL environment variable is not set');
    }

    const response = await axios.post(vercelHookUrl, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Deployment triggered successfully. Status: ${response.status}`);
    res.status(200).send('Deployment triggered successfully');
    return true;
  } catch (error) {
    console.error('Failed to trigger deployment:', error.message);
    res.status(500).send('Failed to trigger deployment');
    throw error;
  }
};

// Define routes
app.post('/new-game', asyncHandler(async (req, res, next) => {
  const jsonData = req.body;
  const { player, spotify_link } = jsonData;
  if (!players.includes(player)) {
    res.status(400).send('Invalid player');
    return;
  }
  const client = await pool.connect();
  const result = await client.query('SELECT * FROM games WHERE link = $1', [spotify_link]);
  if (result.rows.length > 0) {
    res.status(400).send('Game already exists');
    return;
  }
  try {
    await client.query('INSERT INTO games (name, link) VALUES ($1, $2)', [player, spotify_link]);
    await triggerDeploy(req, res);
    res.status(200).send('Game created, and deploy triggered');
  } catch (err) {
    res.status(500).send('Error creating game' + err);
  } finally {
    client.release(); // Don't forget to release the client
  }
}));

app.get('/', (req, res) => {
  res.render('form');
});

app.get('/status', (req, res) => {
  res.send('Up and running!')
});

// Only start the server if this file is run directly (for local development)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the app for Vercel
module.exports = app;