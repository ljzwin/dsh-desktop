'use strict';

/**
 * Shared DSH server lifecycle for the Electron shell and the headless launcher.
 *
 * Plain Node (no Electron). It resolves the `dsh` CLI, attaches to a running
 * `web` profile server when one is already listening, or spawns one, and waits
 * until the HTTP surface responds.
 *
 * CLI resolution:
 *   1. $DSH_DESKTOP_BIN — explicit override (a command, e.g. `dsh`, or a path)
 *   2. `dsh` on PATH     — the same CLI you run in a terminal
 */

const { spawn, execSync } = require('node:child_process');
const http = require('node:http');

const DEFAULT_PORT = 3080;
const READY_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 250;

function resolveDshBin() {
  if (process.env.DSH_DESKTOP_BIN) {
    return { command: process.env.DSH_DESKTOP_BIN, args: [], shell: true };
  }
  return { command: 'dsh', args: [], shell: true };
}

function isResponding(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    let u;
    try {
      u = new URL(url);
    } catch {
      return resolve(false);
    }
    const req = http.get(
      { host: u.hostname, port: u.port, path: '/', timeout: timeoutMs },
      () => {
        req.destroy();
        resolve(true);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(url, timeoutMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isResponding(url)) return true;
    await sleep(POLL_INTERVAL_MS);
  }
  return false;
}

function spawnDsh({ port, detach = false }) {
  const { command, args, shell } = resolveDshBin();
  const stdio = detach ? ['ignore', 'ignore', 'ignore'] : ['ignore', 'pipe', 'pipe'];
  const child = spawn(command, [...args, 'web', '--port', String(port)], {
    stdio,
    windowsHide: true,
    shell,
    detached: detach,
    env: process.env,
  });
  if (detach) child.unref();

  let observedUrl = '';
  let buf = '';
  const consume = (chunk) => {
    buf += chunk.toString();
    const m = buf.match(/dsh web: (http:\/\/\S+)/);
    if (m) observedUrl = m[1];
  };
  if (!detach) {
    child.stdout?.on('data', consume);
    child.stderr?.on('data', consume);
  }
  return { child, getUrl: () => observedUrl };
}

/** Best-effort process-tree kill; safe to call on a null/absent child. */
function killChild(child) {
  if (!child || child.exitCode !== null || child.killed) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      return;
    } catch {
      /* fall through to a direct kill */
    }
  }
  try {
    child.kill('SIGTERM');
  } catch {
    /* already gone */
  }
}

/**
 * Ensure a `dsh web` server is reachable.
 *
 * @param {{ port?: number, detach?: boolean }} opts
 * @returns {Promise<{ url: string, child: import('node:child_process').ChildProcess | null, owned: boolean }>}
 *   `owned` is true when this call spawned the server (the caller owns its
 *   lifetime), false when an existing server was attached to.
 */
async function ensureServer({ port = DEFAULT_PORT, detach = false } = {}) {
  const baseUrl = `http://127.0.0.1:${port}`;

  if (port > 0 && (await isResponding(baseUrl))) {
    return { url: baseUrl, child: null, owned: false };
  }

  const spawned = spawnDsh({ port, detach });
  if (port > 0) {
    if (await waitFor(baseUrl)) {
      return { url: baseUrl, child: spawned.child, owned: true };
    }
    if (!detach) {
      killChild(spawned.child);
      const retried = spawnDsh({ port: 0, detach: false });
      const deadline = Date.now() + READY_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const u = retried.getUrl();
        if (u && (await isResponding(u))) {
          return { url: u, child: retried.child, owned: true };
        }
        if (retried.child.exitCode !== null) break;
        await sleep(POLL_INTERVAL_MS);
      }
      killChild(retried.child);
    }
    throw new Error(`dsh web 无法在端口 ${port} 上启动`);
  }

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const u = spawned.getUrl();
    if (u && (await isResponding(u))) {
      return { url: u, child: spawned.child, owned: true };
    }
    if (spawned.child.exitCode !== null) break;
    await sleep(POLL_INTERVAL_MS);
  }
  killChild(spawned.child);
  throw new Error('dsh web 服务未能就绪');
}

module.exports = {
  DEFAULT_PORT,
  resolveDshBin,
  isResponding,
  waitFor,
  spawnDsh,
  killChild,
  ensureServer,
};
