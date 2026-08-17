'use strict';

/**
 * Zero-dependency launcher: ensure the `dsh web` server is up, then open it in
 * a chromeless Edge/Chrome app window (no address bar, no tabs — looks like a
 * standalone application). The server, when spawned here, is detached so it
 * survives this launcher; `stop.js` shuts it down.
 */

const { spawn } = require('node:child_process');
const { existsSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { ensureServer } = require('./lib/dsh-server.js');

const PID_FILE = path.join(__dirname, '.server.pid');

function findChromium() {
  const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p));
}

async function main() {
  const browser = findChromium();
  if (!browser) {
    console.error('未找到 Edge / Chrome。请安装其中一个，或改用 Electron 版（npm start）。');
    process.exit(2);
  }

  const port = Number(process.env.DSH_DESKTOP_PORT || 3080);
  const server = await ensureServer({ port, detach: true });

  if (server.owned && server.child) {
    writeFileSync(PID_FILE, String(server.child.pid));
  }

  spawn(browser, [`--app=${server.url}`, '--window-size=1280,860'], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  console.log(`DeepSeek Harness 已打开：${server.url}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
