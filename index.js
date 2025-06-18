const express = require('express');
const { urlencoded } = require('body-parser');
const { Pool } = require('pg');
const asyncHandler = require('express-async-handler')
const axios = require('axios');
const spotifyClient = require('./spotifyClient');

// Function to get the Wednesday of this week
function getThisWeeksWednesday() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0) being considered the start of the week
    const wednesday = new Date(today.setDate(diff + 3)); // 3 represents Wednesday (0=Sunday, 1=Monday, ..., 6=Saturday)
    return wednesday;
}

// This is the only exported function - we don't need to start the server to use it
exports.triggerDeploy = async () => {
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
    return true;
  } catch (error) {
    console.error('Failed to trigger deployment:', error.message);
    throw error;
  }
};

// Only start the server if this file is run directly
if (require.main === module) {
  const app = express();
  app.use(urlencoded({ extended: false }));
  app.use(express.json());
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

  app.post('/new-game', asyncHandler(async (req, res, next) => {
    const jsonData = req.body;
    const { player, spotify_link } = jsonData;
    if (!players.includes(player)) {
      res.status(400).send('Invalid player');
      return;
    }
    const client = await pool.connect();
    try {
      await client.query('INSERT INTO games (name, link) VALUES ($1, $2)', [player, spotify_link]);
      await triggerDeploy();
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
    console.log(`Server running on port ${port}`);
  });
}
