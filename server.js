const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Homepage route - logs IP and serves index.html
app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip} visited /\n`;

  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP:', err);
    else console.log('Logged visit to /:', logLine.trim());
  });

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// /games route - logs IP and shows redirecting message
app.get('/games', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip} visited /games\n`;

  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) console.error('Failed to log IP at /games:', err);
    else console.log('Logged visit to /games:', logLine.trim());
  });

  res.send(`
    <html>
      <head>
        <title>Redirecting to games...</title>
        <meta http-equiv="refresh" content="3;url=/games/placeholder" />
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          h1 { color: #333; }
          p { font-size: 1.2em; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Redirecting to games...</h1>
        <p>If you are not redirected automatically, <a href="/games/placeholder">click here</a>.</p>
      </body>
    </html>
  `);
});

// Placeholder route for future game logic
app.get('/games/placeholder', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Game Placeholder</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          h1 { color: #444; }
        </style>
      </head>
      <body>
        <h1>Game logic coming soon! 🚀</h1>
        <p>Thanks for your patience.</p>
      </body>
    </html>
  `);
});

// Admin page to view logs (with password)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/admin', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASS) {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, ''); // Create if missing
      }

      const logs = fs.readFileSync(LOG_FILE, 'utf8');
      if (logs.trim().length === 0) {
        return res.send('No logs yet! Visit the homepage to generate logs.');
      }

      res.send(`<pre>${logs}</pre>`);
    } catch (err) {
      console.error('Error reading logs:', err);
      res.status(500).send('Server error reading logs.');
    }
  } else {
    res.send('Access denied 😤');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
