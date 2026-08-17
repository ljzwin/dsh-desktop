'use strict';

/**
 * DeepSeek Harness desktop shell — Electron main process.
 *
 * Fully frameless (no title-bar strip, no native frame). The DSH UI fills the
 * whole window; a slim invisible drag strip and three theme-matched window
 * control buttons (minimize / maximize / close) are injected by preload.js.
 * Single-instance: attaches to a running `dsh web` server, or spawns one and
 * owns its lifetime.
 */

const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const path = require('node:path');
const { ensureServer, killChild } = require('./lib/dsh-server.js');

let server = null; // { url, child, owned }
let win = null;

// Injected window-control buttons call these via ipcRenderer.
ipcMain.on('window:minimize', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.minimize();
});
ipcMain.on('window:toggle-maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  if (w.isMaximized()) w.unmaximize();
  else w.maximize();
});
ipcMain.on('window:close', (e) => {
  BrowserWindow.fromWebContents(e.sender)?.close();
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  async function boot() {
    const port = Number(process.env.DSH_DESKTOP_PORT || 3080);
    try {
      server = await ensureServer({ port });
    } catch (err) {
      dialog.showErrorBox(
        'DeepSeek Harness',
        `本地 DSH 服务启动失败：\n\n${err.message}`
      );
      app.quit();
      return;
    }

    Menu.setApplicationMenu(null);
    win = new BrowserWindow({
      width: 1280,
      height: 860,
      minWidth: 900,
      minHeight: 600,
      title: 'DeepSeek Harness',
      backgroundColor: '#0d1117',
      frame: false, // no native title bar / frame
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });
    win.setMenuBarVisibility(false);
    win.on('maximize', () => win.webContents.send('window:maximized-changed', true));
    win.on('unmaximize', () => win.webContents.send('window:maximized-changed', false));
    win.loadURL(server.url);
    win.on('closed', () => {
      win = null;
    });
  }

  app.whenReady().then(boot);

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('will-quit', () => {
    if (server && server.owned && server.child) killChild(server.child);
  });
}
