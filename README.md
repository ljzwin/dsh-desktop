# DeepSeek Harness Desktop

A clean, community desktop shell for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`). It wraps your local `dsh web` server in a **frameless native window** — no browser chrome, no title bar — with theme-matched window controls.

> This is a thin shell: it launches **your own** local `dsh web` server (default `http://127.0.0.1:3080`) and shows it in an Electron window. It never touches your account, keys, or sessions.

## Features

- Frameless window — no title bar, no browser frame
- Theme-matched custom window controls (minimize / maximize / close)
- Single-instance; attaches to an already-running server, or spawns one and cleans it up on quit
- Drag the window from the top edge
- Zero-dependency fallback launcher (`DSH Desktop.cmd` → Edge/Chrome `--app`)

## Prerequisites

- [Node.js](https://nodejs.org)
- The `dsh` CLI on your `PATH`, e.g. `npm install -g @deepseek-ai/dsh`

## Run

```bash
npm install
npm start
```

## Build a portable .exe

```bash
npm run dist
# -> dist/DSH-Desktop-0.1.0.exe
```

> In mainland China the Electron / toolchain downloads can stall on GitHub.
> The build already disables signing (`signAndEditExecutable: false`); you can also
> point the downloads at mirrors before building:
>
> ```powershell
> $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
> $env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"
> ```

## Theme

Built into DSH: **Settings → General → Appearance** → Light / Dark / System. No plugin needed.

## Plugins

```bash
dsh plugin --profile web add <package>
```

## Configuration

| Env var | Purpose |
| --- | --- |
| `DSH_DESKTOP_PORT` | Port to attach to / spawn on (default `3080`) |
| `DSH_DESKTOP_BIN` | Explicit `dsh` entry (a command, or a path to `bin.js`) |

## License

MIT — see [LICENSE](LICENSE).
