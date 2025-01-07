const http = require('http');
const express = require('express');
const { urlencoded } = require('body-parser');
const { Pool } = require('pg');
const asyncHandler = require('express-async-handler')

const request = require("request");

const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
app.use(urlencoded({ extended: false }));


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


// app.post('/delete-last-game', asyncHandler(async (req, res, next) => {
//   const client = await pool.connect();
//   try {
//     await client.query('DELETE FROM games WHERE date_created = (SELECT MAX(date_created) FROM games)');
//     triggerDeploy();
//     res.status(200).send('Game deleted, and deploy triggered');
//   } catch (err) {
//     res.status(500).send('Error deleting game' + err);
//   }
// }));

// app.post('/new-game', asyncHandler(async (req, res, next) => {
//   const jsonData = req.body;
//   const { player } = jsonData;
//   if (!players.includes(player)) {
//     res.status(400).send('Invalid player');
//     return;
//   }
//   const client = await pool.connect();
//   try {
//     await client.query('INSERT INTO games (name) VALUES ($1)', [player]);
//     triggerDeploy();
//     res.status(200).send('Game created, and deploy triggered');
//   } catch (err) {
//     res.status(500).send('Error creating game' + err);
//   }
// }));


app.post('/sms', asyncHandler(async (req, res) => {
  const twiml = new MessagingResponse();
  // const player = req.body.Body;
  twiml.message('Something worked');
  // console.log("Request body", req.body);
  // if (!players.includes(player.toLowerCase())) {
  //   console.log('invalid player');
  //   twiml.message('Invalid player');
  //   res.writeHead(400, { 'Content-Type': 'text/xml' });
  //   res.end(twiml.toString());
  // }
  // console.log("Saving valid player");
  // const client = await pool.connect();
  // try {
  //   await client.query('INSERT INTO games (name) VALUES ($1)', [player]);
  //   console.log("Triggering Deploy");
  //   triggerDeploy();
  //   twiml.message('Game created, and deploy triggered');
  // } catch (err) {
  //   console.log("Error creating the game");
  //   twiml.message('Error creating game' + err);
  // }
  res.type('text/xml').send(twiml.toString());
  res.status(200).end()
}));

app.get('/', (req, res) => {
  res.send('Up and running!')
});

app.listen(port, () => {
  console.log('Esample listening on port')
});
