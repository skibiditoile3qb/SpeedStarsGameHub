const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

console.log('Starting server.js...');

// Check if logs directory exists
const logsDirExists = fs.existsSync(LOG_DIR);
console.log('Logs directory exists:', logsDirExists);

if (!logsDirExists) {
  try {
    fs.mkdirSync(LOG_DIR);
    console.log('Created logs directory.');
  } catch (e) {
    console.error('Failed to create logs directory:', e);
  }
}

// Check if log file exists
const logFileExists = fs.existsSync(LOG_FILE);
console.log('Log file exists:', logFileExists);

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Main route - logs IP synchronously for easier debugging
app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'UNKNOWN_IP';
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logLine);
    console.log('IP logged:', logLine.trim());
  } catch (err) {
    console.error('Failed to log IP:', err);
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin GET route - shows admin login form
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Admin POST route - shows logs if password matches
app.post('/admin', (req, res) => {
  const { password } = req.body;
  console.log('Admin login attempt with password:', password);

  if (password === ADMIN_PASS) {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, '');
        console.log('Created empty log file during /admin access');
      }

      const logs = fs.readFileSync(LOG_FILE, 'utf8');
      console.log('Read logs length:', logs.length);

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

// DEBUG ROUTES

// Check logs directory existence & path
app.get('/debug/check', (req, res) => {
  res.json({
    logsDirExists: fs.existsSync(LOG_DIR),
    logDirPath: LOG_DIR,
  });
});

// Check if log file exists & file path
app.get('/debug/log-file-check', (req, res) => {
  res.json({
    logFileExists: fs.existsSync(LOG_FILE),
    logFilePath: LOG_FILE,
  });
});

// Read log file contents (no auth, for debug only)
app.get('/debug/log-contents', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.json({ error: 'Log file does not exist.' });
    }
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.json({ recentLogs: logs.split('\n').slice(-20) });
  } catch (err) {
    console.error('Error reading logs:', err);
    res.status(500).json({ error: 'Failed to read logs.' });
  }
});

// Show current IP from a request
app.get('/debug/ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'UNKNOWN_IP';
  console.log('Debug /debug/ip hit:', ip);
  res.json({ yourIP: ip });
});

// Test writing a dummy line to the log file sync
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
