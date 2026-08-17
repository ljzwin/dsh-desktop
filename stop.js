'use strict';

/**
 * Stop the detached `dsh web` server that `launch.js` may have started.
 * No-op when it was never spawned (e.g. it attached to an existing server).
 */

const { execSync } = require('node:child_process');
const { existsSync, readFileSync, unlinkSync } = require('node:fs');
const path = require('node:path');

const PID_FILE = path.join(__dirname, '.server.pid');

function main() {
  if (!existsSync(PID_FILE)) {
    console.log('没有由桌面启动器托管的 DSH 服务在运行（或它本就由外部管理）。');
    return;
  }
  const pid = readFileSync(PID_FILE, 'utf8').trim();
  if (!/^\d+$/.test(pid)) {
    unlinkSync(PID_FILE);
    return;
  }
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGTERM');
    }
    console.log(`已停止 DSH 服务（PID ${pid}）。`);
  } catch {
    console.log(`DSH 服务（PID ${pid}）已不在运行。`);
  } finally {
    try {
      unlinkSync(PID_FILE);
    } catch {
      /* ignore */
    }
  }
}

main();
