const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Redirect root to intro
app.get('/', (req, res) => {
  res.redirect('/intro');
});

// Intro animation page
app.get('/intro', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'intro.html'));
});

// Main homepage after intro
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Game redirect page
app.get('/games/:game', (req, res) => {
  const { game } = req.params;

  // Log visitor IP on game selection
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip} - selected game: ${game}\n`;
  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP:', err);
    else console.log('Game selected logged:', logLine.trim());
  });

  // Redirect URLs for each game
  const redirectUrls = {
    templerun: 'https://githubshrub.github.io/html5-games/games/templerun2/',
    speedstars: 'https://speedstarsfree.github.io/',
    subway: 'https://dddavit.github.io/subway/',
  };

  const redirectUrl = redirectUrls[game.toLowerCase()];
  if (!redirectUrl) {
    return res.status(404).send('Game not found');
  }

  // Send redirect page with "Redirecting..." message and redirect after 3 seconds
  res.send(`
    <html>
      <head>
        <title>Redirecting to ${game}</title>
        <meta http-equiv="refresh" content="3;url=${redirectUrl}">
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background: #121212; color: #fff; }
          .message { text-align: center; }
          h1 { font-size: 3em; margin-bottom: 0.2em; }
          p { font-size: 1.5em; color: #ccc; }
        </style>
      </head>
      <body>
        <div class="message">
          <h1>Redirecting to ${game}...</h1>
          <p>If you are not redirected automatically, <a href="${redirectUrl}" style="color:#09f;">click here</a>.</p>
        </div>
      </body>
    </html>
  `);
});

// Admin and logging routes here...

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
