#!/usr/bin/env node
// One-command demo launcher: starts the server (if needed) and opens the demo.

const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DEMO_URL = `http://localhost:${PORT}/basic-demo.html`;
const HEALTH_URL = `http://localhost:${PORT}/health`;
const IMPORT_URL = `http://localhost:${PORT}/api/import/local-csv`;
const LLM_URL = `http://localhost:${PORT}/api/llm/enhance`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      const { statusCode } = res;
      res.resume(); // drain
      resolve(statusCode);
    });
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(new Error('timeout')); });
  });
}

function httpPostJson(url, json) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(json || {}));
    const u = new URL(url);
    const req = http.request({
      method: 'POST',
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function waitForHealth(tries = 20) {
  for (let i = 0; i < tries; i++) {
    try {
      const code = await httpGet(HEALTH_URL);
      if (code === 200) return true;
    } catch (_) {}
    await sleep(500);
  }
  return false;
}

function openBrowser(url) {
  const platform = os.platform();
  if (platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
  } else if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref();
  } else {
    spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
  }
}

(async () => {
  // If a server is already up, just open the page.
  const alreadyUp = await waitForHealth(2);
  if (alreadyUp) {
    console.log(`Server is running on ${PORT}. Opening ${DEMO_URL}…`);
    openBrowser(DEMO_URL);
    return;
  }

  console.log(`Starting server on port ${PORT}…`);
  const child = spawn(process.execPath, ['index.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit'
  });

  // Graceful shutdown
  const shutdown = () => { try { child.kill(); } catch (_) {} };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const ok = await waitForHealth(20);
  if (!ok) {
    console.error('Server did not become healthy. Check logs above.');
    process.exit(1);
  }
  // Import Pavel's CSV and wait for it
  try {
    const resp = await httpPostJson(IMPORT_URL, { path: 'song metadata (2).csv' });
    console.log(`Import CSV -> ${resp.status}`);
  } catch (e) {
    console.log('Import CSV skipped or failed (continuing):', e.message);
  }

  // Run a small LLM enhancement pass and wait for it so tags are merged
  try {
    const resp = await httpPostJson(LLM_URL, { maxSongs: 30, onlySparseTags: true });
    console.log(`LLM enhance -> ${resp.status}`);
  } catch (e) {
    console.log('LLM enhancement failed (continuing):', e.message);
  }

  // Ensure users overview is available with suggestions
  for (let i = 0; i < 10; i++) {
    try {
      const code = await httpGet(`http://localhost:${PORT}/api/demo/users-overview`);
      if (code === 200) break;
    } catch (_) {}
    await sleep(500);
  }

  console.log(`OK. Opening ${DEMO_URL} …`);
  openBrowser(DEMO_URL);
})();
