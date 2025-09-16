#!/usr/bin/env node
// Force-restart the demo server, reimport data, run LLM enhancement, and open the demo.

const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DEMO_URL = `http://localhost:${PORT}/basic-demo.html`;

function killPort(port) {
  try {
    if (os.platform() === 'win32') {
      execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"`, { stdio: 'ignore' });
    } else {
      const pids = execSync(`lsof -ti tcp:${port} || true`).toString().trim();
      if (pids) {
        execSync(`kill -9 ${pids}`, { stdio: 'ignore' });
      }
    }
  } catch (_) {}
}

(async () => {
  console.log(`Restarting server on port ${PORT}…`);
  killPort(PORT);
  // Chain to the regular start script which imports CSV, enhances with LLM, and opens the browser
  const child = spawn(process.execPath, [path.join('scripts', 'start-demo.js')], { stdio: 'inherit', env: { ...process.env, PORT: String(PORT) } });
  child.on('exit', code => {
    if (code === 0) {
      console.log(`\nDemo ready: ${DEMO_URL}`);
    } else {
      console.error('Demo failed to start. See logs above.');
    }
  });
})();

