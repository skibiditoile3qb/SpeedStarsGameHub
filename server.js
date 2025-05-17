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

// Homepage that plays intro and then redirects to /home
app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip}\n`;

  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Actual game selection page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Redirect handler for games
app.get('/games/:game', (req, res) => {
  const redirects = {
    temple: "https://githubshrub.github.io/html5-games/games/templerun2/",
    speedstars: "https://speedstarsfree.github.io/",
    subway: "https://dddavit.github.io/subway/"
  };

  const selected = redirects[req.params.game];
  if (selected) {
    res.send(`<html><head><meta http-equiv="refresh" content="2;url=${selected}"/></head><body><h2>Redirecting...</h2></body></html>`);
  } else {
    res.status(404).send("Game not found.");
  }
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/admin', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASS) {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    if (logs.trim().length === 0) {
      return res.send('No logs yet! Visit the homepage to generate logs.');
    }
    res.send(`<pre>${logs}</pre>`);
  } else {
    res.send('Access denied 😤');
  }
});

// Debug routes
app.get('/debug/ip', (req, res) => {
  res.send({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress });
});

app.get('/debug/log-check', (req, res) => {
  res.send({
    logsDirExists: fs.existsSync(LOG_DIR),
    logFileExists: fs.existsSync(LOG_FILE)
  });
});

app.get('/debug/log-contents', (req, res) => {
  if (fs.existsSync(LOG_FILE)) {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.send({ recentLogs: logs.trim().split('\n').slice(-10) });
  } else {
    res.send({ error: 'Log file missing' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
