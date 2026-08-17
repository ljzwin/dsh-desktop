'use strict';

/**
 * Renderer preload (sandboxed, isolated world). Injects, into the DSH page:
 *   1. an invisible draggable strip across the top (frameless drag),
 *   2. three theme-matched window-control buttons (min/max/close) top-right.
 */

const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    #dsh-window-controls {
      position: fixed; top: 0; right: 0; height: 36px;
      display: flex; z-index: 2147483646;
      -webkit-app-region: no-drag;
      font-family: 'Segoe MDL2 Assets', 'Segoe UI', sans-serif;
    }
    #dsh-window-controls button {
      width: 46px; height: 36px; border: none; padding: 0;
      background: transparent;
      color: var(--dsw-alias-text-secondary, #9aa7b4);
      font-size: 10px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      -webkit-app-region: no-drag; cursor: default;
    }
    #dsh-window-controls button:hover {
      background: var(--dsw-alias-button-floating-hover, rgba(255, 255, 255, 0.1));
      color: var(--dsw-alias-text-primary, #e6edf3);
    }
    #dsh-window-controls .dsh-close:hover { background: #e81123; color: #ffffff; }
  `;
  document.head.appendChild(style);

  // Invisible draggable strip across the top, clear of the controls on the right.
  const bar = document.createElement('div');
  bar.style.cssText =
    'position:fixed;top:0;left:0;right:138px;height:36px;' +
    'z-index:2147483645;-webkit-app-region:drag;';
  document.body.appendChild(bar);

  const controls = document.createElement('div');
  controls.id = 'dsh-window-controls';
  controls.innerHTML =
    '<button title="最小化" aria-label="最小化">&#xE921;</button>' +
    '<button title="最大化" aria-label="最大化">&#xE922;</button>' +
    '<button class="dsh-close" title="关闭" aria-label="关闭">&#xE8BB;</button>';
  const [minBtn, maxBtn, closeBtn] = controls.querySelectorAll('button');
  minBtn.addEventListener('click', () => ipcRenderer.send('window:minimize'));
  maxBtn.addEventListener('click', () => ipcRenderer.send('window:toggle-maximize'));
  closeBtn.addEventListener('click', () => ipcRenderer.send('window:close'));

  ipcRenderer.on('window:maximized-changed', (_e, isMax) => {
    maxBtn.innerHTML = isMax ? '&#xE923;' : '&#xE922;';
  });

  document.body.appendChild(controls);
});
