const express = require('express');
const fs = require('fs');
const path = require('path');

console.log('Starting server.js...');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
  console.log('Created logs directory.');
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
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
    <h1>Welcome to My Test Website 🎉</h1>
    <p>Your visit has been logged (for testing purposes).</p>
  `);
});

app.get('/admin', (req, res) => {
  res.send(`
    <form method="POST" action="/admin">
      <input type="password" name="password" placeholder="Admin Password" required />
      <button type="submit">View Logs</button>
    </form>
  `);
});

app.post('/admin', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASS) {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(LOG_FILE, ''); // Create the file if it doesn't exist
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
