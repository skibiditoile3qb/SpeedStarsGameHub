const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

console.log('Starting server.js...');

// Make sure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR);
    console.log('Created logs directory.');
  } catch (e) {
    console.error('Failed to create logs directory:', e);
  }
}

// Make sure log file exists
if (!fs.existsSync(LOG_FILE)) {
  try {
    fs.writeFileSync(LOG_FILE, '');
    console.log('Created empty log file.');
  } catch (e) {
    console.error('Failed to create log file:', e);
  }
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Main homepage route — just show index.html, NO logging here
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Logging route — logs IP when visiting /games
app.get('/games', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'UNKNOWN_IP';
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logLine);
    console.log('IP logged at /games:', logLine.trim());
  } catch (err) {
    console.error('Failed to log IP at /games:', err);
  }

  res.send('Welcome to the games page! Your visit has been logged.');
});

// Admin GET - show login page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Admin POST - check password and show logs
app.post('/admin', (req, res) => {
  const { password } = req.body;
  console.log('Admin login attempt with password:', password);

  if (password === ADMIN_PASS) {
    try {
      const logs = fs.readFileSync(LOG_FILE, 'utf8');
      if (logs.trim().length === 0) {
        return res.send('No logs yet! Visit /games to generate logs.');
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

// Debug endpoints
app.get('/debug/check', (req, res) => {
  res.json({
    logsDirExists: fs.existsSync(LOG_DIR),
    logDirPath: LOG_DIR,
  });
});

app.get('/debug/log-file-check', (req, res) => {
  res.json({
    logFileExists: fs.existsSync(LOG_FILE),
    logFilePath: LOG_FILE,
  });
});

app.get('/debug/log-contents', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.json({ recentLogs: logs.split('\n').slice(-20) });
  } catch (err) {
    console.error('Error reading logs:', err);
    res.status(500).json({ error: 'Failed to read logs.' });
  }
});

app.get('/debug/ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'UNKNOWN_IP';
  console.log('Debug /debug/ip hit:', ip);
  res.json({ yourIP: ip });
});

app.get('/debug/test-log-write', (req, res) => {
  const testLine = `${new Date().toISOString()} - TEST_LOG_LINE\n`;
  try {
    fs.appendFileSync(LOG_FILE, testLine);
    console.log('Test log line written:', testLine.trim());
    res.send('Test log line successfully written.');
  } catch (err) {
    console.error('Failed to write test log line:', err);
    res.status(500).send('Failed to write test log line.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
