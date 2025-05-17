const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

// DEBUG helper to send JSON response
function debugJSON(res, obj) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(obj, null, 2));
}

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
  console.log('Created logs directory.');
} else {
  console.log('Logs directory exists:', true);
}

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
  console.log('Created empty ip-log.txt file.');
} else {
  console.log('Log file exists:', true);
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Home route - logs IP and responds with simple page
app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip}\n`;

  fs.appendFile(LOG_FILE, logLine, err => {
    if (err) {
      console.error('Failed to log IP:', err);
    } else {
      console.log('IP logged:', logLine.trim());
    }
  });

  res.send(`
    <html>
      <body>
        <h1>Welcome to My Test Website 🎉</h1>
        <p>Your visit has been logged (for testing purposes).</p>
      </body>
    </html>
  `);
});

// Admin page form
app.get('/admin', (req, res) => {
  res.send(`
    <form method="POST">
      <input type="password" name="password" placeholder="Enter admin password" />
      <button type="submit">View Logs</button>
    </form>
  `);
});

// Admin logs viewer
app.post('/admin', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASS) {
    try {
      const logs = fs.readFileSync(LOG_FILE, 'utf8');

      if (!logs.trim()) {
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

// ==== DEBUG ROUTES ====

// Check if logs directory exists
app.get('/debug/logs-dir', (req, res) => {
  const exists = fs.existsSync(LOG_DIR);
  console.log('/debug/logs-dir checked:', exists);
  debugJSON(res, { logsDirExists: exists, path: LOG_DIR });
});

// Check if log file exists
app.get('/debug/log-file', (req, res) => {
  const exists = fs.existsSync(LOG_FILE);
  console.log('/debug/log-file checked:', exists);
  debugJSON(res, { logFileExists: exists, path: LOG_FILE });
});

// Read current logs file contents (no auth for debugging only!)
app.get('/debug/logs-content', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    console.log('/debug/logs-content read, length:', logs.length);
    debugJSON(res, { length: logs.length, content: logs });
  } catch (err) {
    console.error('/debug/logs-content error:', err);
    res.status(500).send('Failed to read logs file');
  }
});

// Show recent log entries only
app.get('/debug/logs-recent', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
    const last10 = logs.slice(-10);
    console.log('/debug/logs-recent:', last10.length, 'entries');
    debugJSON(res, { recentLogs: last10 });
  } catch (err) {
    console.error('/debug/logs-recent error:', err);
    res.status(500).send('Failed to read logs file');
  }
});

// Show server environment variables
app.get('/debug/env', (req, res) => {
  console.log('/debug/env called');
  debugJSON(res, process.env);
});

// Test logging directly (append a test line to logs)
app.get('/debug/test-log', (req, res) => {
  const testLine = `${new Date().toISOString()} - DEBUG TEST LOG\n`;
  fs.appendFile(LOG_FILE, testLine, err => {
    if (err) {
      console.error('/debug/test-log failed to write:', err);
      return res.status(500).send('Failed to write test log');
    }
    console.log('/debug/test-log appended:', testLine.trim());
    res.send('Appended a test log line!');
  });
});

// Check IP capture from headers & socket
app.get('/debug/ip', (req, res) => {
  const ipHeader = req.headers['x-forwarded-for'];
  const socketIp = req.socket.remoteAddress;
  console.log('/debug/ip requested:', { ipHeader, socketIp });
  debugJSON(res, { ipHeader, socketIp });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
