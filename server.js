const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

// Ensure logs directory and log file exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from /public
app.use(express.urlencoded({ extended: true }));

// Log IPs to file
function logIP(req, label = 'visited') {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const line = `${timestamp} - ${ip} ${label}\n`;
  fs.appendFile(LOG_FILE, line, err => {
    if (err) console.error('Error logging IP:', err);
    else console.log('Logged:', line.trim());
  });
}

// Redirect root "/" to /intro (or serve intro directly)
app.get('/', (req, res) => {
  res.redirect('/intro');
});

// Serve the intro page (with audio)
app.get('/intro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
});

// After intro — /home (log visit)
app.get('/home', (req, res) => {
  logIP(req, 'visited /home');
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Game page handler with logging + actual redirection
app.get('/games/:game', (req, res) => {
  const game = req.params.game;
  logIP(req, `clicked game: ${game}`);

  const redirectMap = {
    templerun: 'https://githubshrub.github.io/html5-games/games/templerun2/',
    speedstars: 'https://speedstarsfree.github.io/',
    subway: 'https://dddavit.github.io/subway/'
  };

  const targetURL = redirectMap[game.toLowerCase()];
  if (targetURL) {
    res.redirect(targetURL);
  } else {
    res.status(404).send(`<h1>Unknown game: ${game}</h1>`);
  }
});

// Admin viewer
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/admin', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS) {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.send(logs.trim() ? `<pre>${logs}</pre>` : 'No logs yet!');
  } else {
    res.send('Access denied ❌');
  }
});

// === Optional Debug Endpoints ===
app.get('/debug/ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.json({ ip });
});

app.get('/debug/log-exists', (req, res) => {
  res.json({
    logsDirExists: fs.existsSync(LOG_DIR),
    logFileExists: fs.existsSync(LOG_FILE)
  });
});

app.get('/debug/log-contents', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.json({ recentLogs: logs.trim().split('\n').slice(-10) });
  } catch {
    res.status(500).json({ error: 'Could not read log file' });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
