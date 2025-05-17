/* ---------- basic setup ---------- */
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const app     = express();

const PORT = process.env.PORT || 10000;   // Render auto‑sets this
const HOST = '0.0.0.0';                   // must bind all interfaces

const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ip-log.txt');

/* ensure log dir/file */
if (!fs.existsSync(LOG_DIR))  fs.mkdirSync(LOG_DIR);
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');

/* middleware */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

/* util: ip logger */
function logIP(req, label = 'visited') {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ts = new Date().toISOString();
  fs.appendFile(LOG_FILE, `${ts} - ${ip} ${label}\n`, err =>
    err && console.error('Log error:', err)
  );
}

/* ---------- routes ---------- */

app.get('/',        (_,res)=> res.redirect('/intro'));
app.get('/intro',   (_,res)=> res.sendFile(path.join(__dirname,'public','intro.html')));

app.get('/home',  (req,res)=> {
  logIP(req,'visited /home');
  res.sendFile(path.join(__dirname,'public','home.html'));
});

/* pretty game routes ( /templerun → /games/templerun ) */
['templerun','speedstars','subway','candy'].forEach(game=>{
  app.get(`/${game}`, (_,res)=> res.redirect(`/games/${game}`));
});

/* main game redirect handler */
app.get('/games/:game',(req,res)=>{
  const game = req.params.game.toLowerCase();
  logIP(req,`clicked game: ${game}`);

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
app.get('/debug/ip',          (req,res)=> res.json({ ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }));
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

/* optional: bump keep‑alive */
server.keepAliveTimeout = 120_000;
server.headersTimeout   = 121_000;
