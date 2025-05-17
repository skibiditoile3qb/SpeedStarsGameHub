const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Logging paths
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

// Ensure logs directory and file exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
  console.log('Created logs directory.');
}

if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
  console.log('Created empty ip-log.txt');
}

app.use(express.static(path.join(__dirname, 'public')));

// ========== Routes ==========

// Homepage intro
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Main game selection
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Game redirects
app.get('/games/:game', (req, res) => {
  const redirects = {
    templerun: 'https://githubshrub.github.io/html5-games/games/templerun2/',
    speedstars: 'https://speedstarsfree.github.io/',
    subway: 'https://dddavit.github.io/subway/'
  };

  const game = req.params.game;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${ip} visited ${game}\n`;

  fs.appendFile(LOG_FILE, logEntry, err => {
    if (err) console.error('Error logging IP:', err);
  });

  if (redirects[game]) {
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="2;url=${redirects[game]}">
          <style>body { background: #000; color: #fff; text-align: center; font-size: 2rem; }</style>
        </head>
        <body>Redirecting to ${game}...</body>
      </html>
    `);
  } else {
    res.status(404).send('Game not found');
  }
});

// ========== Debug routes ==========
app.get('/debug/logs-dir', (req, res) => {
  res.json({ logsDirExists: fs.existsSync(LOG_DIR), path: LOG_DIR });
});

app.get('/debug/log-file', (req, res) => {
  res.json({ logFileExists: fs.existsSync(LOG_FILE), path: LOG_FILE });
});

app.get('/debug/log-contents', (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.status(404).json({ error: 'Log file does not exist' });
  }

  const contents = fs.readFileSync(LOG_FILE, 'utf8');
  res.json({ recentLogs: contents.trim().split('\n').slice(-10) });
});

app.get('/debug/ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.json({ ip });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
