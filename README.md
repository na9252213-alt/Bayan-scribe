# Bayan Scribe — بیان اسکرائب

Free offline transcription PWA for bayans, clips and audio — Urdu, Pashto, Arabic and English. Runs fully in the browser using Whisper (via transformers.js / ONNX + WebAssembly). No server, no API key, no account. Audio never leaves the phone.

**Live app:** https://na9252213-alt.github.io/bayan-scribe/

## How it works

- Upload an audio/video file, or record with the microphone, pick the language, and transcribe.
- First use downloads the Whisper voice model once (tiny ≈ 44 MB total, the default) — internet needed once. After that, transcription works fully offline. The model is cached in the browser.
- The download is resumable: each model file is fetched in 5 MB chunks (HTTP Range), finished chunks are stored in IndexedDB, and a later run downloads only the missing chunks — switching apps or losing the connection no longer restarts the download from zero. Once a file is complete it is assembled into the service worker's runtime cache under the exact URL transformers.js requests. A screen wake lock is held during download.
- Transcript is editable. Export to Word (.docx, client-side via docx.js), SRT subtitles, or copy. "Send to Google Docs" uses the Web Share API (falls back to copy + opening Google Docs) — that step needs internet.
- Installable PWA: manifest + service worker cache the app shell and libraries for offline use.

## Honest limits

- Pashto transcription will have errors — Whisper's Pashto is weak. Urdu and Arabic are much better. The transcript is editable.
- Long bayans take time on a budget phone (roughly a few minutes per 10 minutes of audio, depending on model).
- Model sizes (weights + tokenizer files): tiny ≈ 44 MB (default), base ≈ 80 MB, small ≈ 252 MB.

## Files

- `index.html` — the whole app (single file)
- `manifest.json` — PWA manifest
- `sw.js` — service worker (offline caching)
- `icon.svg`, `icon-maskable.svg` — app icons
