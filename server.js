const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} - ${ip}\n`;

  fs.appendFile('ip-log.txt', logLine, err => {
    if (err) console.error('Failed to log IP:', err);
  });

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.post('/admin', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASS) {
    const logs = fs.readFileSync('ip-log.txt', 'utf8');
    res.send(`<pre>${logs}</pre>`);
  } else {
    res.send('Access denied 😤');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
