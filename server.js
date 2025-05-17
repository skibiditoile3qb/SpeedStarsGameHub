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
  console.log('Created logs directory');
} else {
  console.log('Logs directory exists');
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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

  res.sendFile(path.join(__dirname, 'public', 'index.html'), err => {
    if (err) {
      console.error('Failed to send index.html:', err);
      res.status(500).send('Error loading homepage');
    }
  });
});

// Admin page (GET)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'), err => {
    if (err) {
      console.error('Failed to send admin.html:', err);
      res.status(500).send('Error loading admin page');
    }
  });
});

// Admin page (POST) - Password protected to view logs
app.post('/admin', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASS) {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, '');
        console.log('Created empty log file');
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

// Debug route to check if logs dir and file exist
app.get('/debug', (req, res) => {
  try {
    const dirExists = fs.existsSync(LOG_DIR);
    const fileExists = fs.existsSync(LOG_FILE);
    res.send(`Logs directory exists: ${dirExists}\nLog file exists: ${fileExists}`);
  } catch (err) {
    res.status(500).send(`Error checking logs: ${err.message}`);
  }
});

// Test route to write a test log line
app.get('/testlog', (req, res) => {
  const testLine = `Test log at ${new Date().toISOString()}\n`;
  fs.appendFile(LOG_FILE, testLine, err => {
    if (err) {
      console.error('Failed to write test log:', err);
      return res.status(500).send('Failed to write test log.');
    }
    console.log('Test log written!');
    res.send('Test log written!');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
