# Vaccine Schedule Builder — Desktop (Offline) Edition

This document covers building and running the **desktop app** version.
The desktop version works completely offline — no internet required for schedule generation.
The AI-generated parent note requires an internet connection and an Anthropic API key.

---

## Prerequisites

- Node.js 18+ installed
- npm installed
- The project dependencies installed (`npm install`)

---

## Building the Desktop Installer

### Windows (.exe installer)

```powershell
npm run electron:build-win
```

Output: `dist/Vaccine Schedule Builder Setup 1.0.0.exe`

Run the `.exe` to install. Creates a Start Menu shortcut and optional desktop shortcut.

### macOS (.dmg)

```bash
npm run electron:build-mac
```

Output: `dist/Vaccine Schedule Builder-1.0.0.dmg`

### Current platform (auto-detect)

```bash
npm run electron:build
```

---

## What the Build Does

1. Builds Next.js in **standalone mode** — a self-contained Node.js server with minimal dependencies
2. Copies static assets and public files into the standalone bundle
3. Copies `.env.local` (with your API key) into the bundle so AI summaries work offline
4. Packages everything with Electron into a native installer

---

## Running in Development (without installing)

To test the desktop app before packaging:

```bash
# First start the Next.js dev server
npm run dev

# In a second terminal, open the Electron window
npm run electron:dev
```

---

## Icon

Replace the placeholder icon files before distributing:

- `electron/assets/icon.ico` — Windows (256×256 recommended, ICO format)
- `electron/assets/icon.icns` — macOS (512×512 recommended, ICNS format)
- `electron/assets/dmg-background.png` — macOS DMG background (540×380px, optional)

Free icon editors: [icoconvert.com](https://icoconvert.com) for ICO, [iconutil](https://developer.apple.com/library/archive/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html) for ICNS.

---

## Offline vs. Online

| Feature | Online (Vercel) | Desktop (offline) |
|---------|----------------|-------------------|
| Schedule generation | ✅ | ✅ |
| Holiday avoidance | ✅ | ✅ |
| All 50 states | ✅ | ✅ |
| Print / PDF | ✅ | ✅ |
| AI parent note | ✅ (needs API key) | ✅ (needs internet + API key) |

The AI parent note will be blank if there is no internet connection or no API key. The schedule itself is fully offline.

---

## Distributing to Colleagues

Share the installer file from the `dist/` folder. Recipients just run the installer — no Node.js or technical setup required.

---

## Notes

- The `electron/` directory and `dist/` output are excluded from git (`.gitignore`)
- To rebuild after code changes: run `npm run electron:build` again
- The installed app runs a local server on port 3003; it does not expose anything to the network
