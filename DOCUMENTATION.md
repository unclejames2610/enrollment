<!--
  Comprehensive single-file documentation for the Enrollment project.
  This file (Markdown) has a plain text twin: DOCUMENTATION.txt
-->

# Enrollment (Face Enrollment App)

An opinionated **Next.js 14 (App Router) + TypeScript + Tailwind** application that captures a user's face via webcam, automatically takes a photo once the face is close enough, and submits it to a backend API for enrollment / further processing. It uses **face-api.js** models hosted locally in `public/models` for detection, landmarks, recognition and expressions.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture & Flow](#architecture--flow)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Core Components](#core-components)
7. [Face Detection Logic](#face-detection-logic)
8. [Environment Variables](#environment-variables)
9. [Local Development](#local-development)
10. [Build & Production](#build--production)
11. [Extending the App](#extending-the-app)
12. [Security & Privacy Notes](#security--privacy-notes)
13. [Performance Considerations](#performance-considerations)
14. [Troubleshooting](#troubleshooting)
15. [Future Improvements](#future-improvements)
16. [FAQ](#faq)

---

## Overview

The application opens the user's webcam, loads `face-api.js` models from the `/models` directory, continuously detects faces, and automatically captures an image when a face bounding box passes a size threshold (proximity heuristic). After capture, the user can recapture or submit the image to an external API endpoint (`/user/upload`) specified via `NEXT_PUBLIC_API_BASE_URL`.

---

## Key Features

- Auto-loading and caching of face detection & recognition models locally.
- Continuous face detection using **TinyFaceDetector** (efficient on the client).
- Automatic photo capture when the face is sufficiently close (width >= 300px & height >= 500px in the configured video resolution).
- Optional submission of captured image to a backend for further processing.
- Basic UI feedback (Move Closer, Photo Already Taken, No camera found, etc.).
- Responsive-ish video container sizing (fixed logical dimensions, styled via Tailwind).
- Minimal, component-driven design ready for extension.

---

## Architecture & Flow

```text
User visits page -> Models load -> Camera permission requested ->
Video stream displayed -> Interval detection loop -> Threshold met -> Photo taken ->
User chooses: Recapture OR Submit -> (Submit) POST multipart/form-data -> API response -> UI feedback
```

Sequence (detailed):

1. `Enrollment` component mounts.
2. `loadModels()` loads four model groups from `/models` (TinyFaceDetector, Landmarks68, Recognition, Expressions).
3. After models load, `getVideo()` requests `navigator.mediaDevices.getUserMedia`.
4. Once video is available, a `setInterval` loop (1000ms) runs detection pipeline.
5. If detection(s) exist and size threshold satisfied and no photo captured yet, `takePhoto()` draws the frame to a hidden `<canvas>` and stores a data URL in state.
6. User presented with action buttons: Recapture or Submit.
7. Submission converts the canvas to a Blob and sends a `FormData` POST to the backend.

---

## Tech Stack

| Area      | Choice                                           | Notes                                  |
| --------- | ------------------------------------------------ | -------------------------------------- |
| Framework | Next.js 14 (App Router)                          | SSR + Client Components as needed      |
| Language  | TypeScript                                       | Strong typing in components            |
| Styling   | Tailwind CSS 3                                   | Utility-first styling                  |
| ML / CV   | face-api.js 0.22.x                               | Client-side face detection & landmarks |
| HTTP      | fetch / axios (axios installed but not yet used) | Could standardize                      |
| UI Icons  | react-icons                                      | Only `IoClose` used currently          |
| Loading   | react-spinners                                   | `SyncLoader` spinner                   |

---

## Project Structure

```
public/
  models/                # face-api.js model files (JSON manifests + shards)
src/
  app/
    layout.tsx           # Root layout (fonts & metadata)
    page.tsx             # Home page mounting <Enrollment />
    globals.css          # Tailwind base import
  views/
    Enrollment.tsx       # Core face enrollment logic
  components/
    ActionButton2.tsx    # Reusable stylable button
    Loader.tsx           # Spinner wrapper
tailwind.config.ts       # Tailwind config (content globs)
package.json             # Scripts & dependencies
```

---

## Core Components

### Enrollment.tsx

Client component orchestrating:

- Model loading (Promise.all on four networks)
- Camera initialization
- Interval-based detection + threshold logic
- Photo capture, preview, submission
- Error and status messaging

Key State:
| State | Purpose |
|-------|---------|
| `modelsLoaded` | Unlocks camera start after models load |
| `hasVideo` | Indicates video stream is active |
| `hasPhoto` | Whether a captured photo is stored |
| `image` | Data URL for preview image |
| `error` / `errorMsg` | User guidance (e.g., Move Closer) |
| `loading` | Submission in progress |

### ActionButton2

Simple stylable button using dynamic Tailwind class fragments. (Note: dynamic class tokens like `bg-${bgColor}` require a safelist if colors are not in the scanned content—see [Extending the App](#extending-the-app)).

### Loader

Wrapper around `SyncLoader` spinner from `react-spinners`.

---

## Face Detection Logic

- Uses `tinyFaceDetector` for performance.
- Every 1000ms: detect all faces, landmarks, expressions.
- Resize results to configured display size (600x1200 logical video frame).
- Filter detections whose bounding boxes meet threshold: width >= 300, height >= 500.
- If any large face and no photo yet: capture frame.
- Canvas overlays bounding boxes (`drawDetections`). Landmarks & expressions drawing currently commented out.

Potential Improvements:

- Debounce or throttle capture more explicitly.
- Replace `setInterval` with `requestAnimationFrame` plus a timer for smoother overlay.
- Parameterize thresholds for different devices / aspect ratios.

---

## Environment Variables

| Variable                   | Required             | Purpose                                              |
| -------------------------- | -------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes (for submission) | Base URL for backend (e.g., https://api.example.com) |

Set in a `.env.local` file (not committed):

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
```

---

## Local Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Make sure the model files exist under `public/models`. The structure must match the fetch paths used by `face-api.js`. (Already present in repo.)

---

## Build & Production

Build:

```bash
npm run build
```

Run production server:

```bash
npm start
```

Deployment Tips:

- Ensure `public/models` is deployed intact (static assets).
- Confirm `NEXT_PUBLIC_API_BASE_URL` is set in hosting provider environment.
- Consider setting proper `Content-Security-Policy` headers (camera + API domains).

---

## Extending the App

Ideas:

- Add face match / recognition by comparing descriptors against stored embeddings.
- Parameter UI for capture thresholds & model selection.
- Introduce a context or store (e.g., Zustand) for multi-step enrollment flows.
- Add accessibility: focus states, ARIA live regions for status messages.
- Provide offline fallback messaging when camera access fails.
- Add a dedicated logging & telemetry layer.

Tailwind Dynamic Classes:
`ActionButton2` constructs classes like `bg-${bgColor}`. Tailwind will purge unknown classes in production unless safelisted. Update `tailwind.config.ts` with a safelist:

```js
// tailwind.config.ts
export default {
  // ...
  safelist: [
    { pattern: /bg-\[#[0-9A-Fa-f]{3,8}\]/ },
    { pattern: /border-\[#[0-9A-Fa-f]{3,8}\]/ },
    "bg-altBlack",
    "border-altBlack",
  ],
};
```

Or refactor to map props to explicit class names.

---

## Security & Privacy Notes

- Camera access requires user consent; never auto-start on non-user initiated navigation if policies tighten.
- Images are kept client-side until user presses Submit.
- Consider adding explicit consent text and a delete action.
- Use HTTPS always; avoid sending biometric data over insecure channels.
- Rate limit or authenticate the upload endpoint.

---

## Performance Considerations

- Model loading occurs once; subsequent navigations (SPA) reuse cached models.
- Using TinyFaceDetector is efficient; if accuracy must increase, enabling MTCNN or SSD MobileNet will increase CPU.
- Interval currently 1000ms: trade-off between responsiveness and CPU. For smoother overlays use `requestAnimationFrame` with an internal tick cadence.
- Canvas clearing each loop; minimize layout thrash by keeping element dimensions static.

---

## Troubleshooting

| Symptom                            | Possible Cause                       | Fix                                                        |
| ---------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| "No camera found"                  | No webcam / permissions denied       | Check browser permissions / hardware                       |
| Models never load                  | Wrong path or missing files          | Ensure `public/models/*.json` accessible (open in browser) |
| Blank video                        | HTTPS requirement (except localhost) | Serve over HTTPS                                           |
| Tailwind styles missing on buttons | Purged dynamic classes               | Add safelist or hardcode classes                           |
| Upload fails                       | Missing `NEXT_PUBLIC_API_BASE_URL`   | Define in `.env.local`                                     |

---

## Future Improvements

- Configurable capture criteria (face size, sharpness, eyes open, expression neutrality).
- Add liveness checks (blink detection) to prevent spoofing.
- Persist face descriptors to enable duplicate detection.
- Replace manual interval with a detection scheduler.
- Progressive loading UI for model fetch progress.

---

## FAQ

**Why store models in /public?**  
`face-api.js` fetches model JSON / weights over HTTP(S); `public` ensures static hosting by Next.js.

**Can I switch to Web Workers?**  
Yes, offloading detection can keep UI responsive; would need worker wrappers for `face-api.js`.

**Why is axios installed but unused?**  
Currently `fetch` suffices; you may standardize on one HTTP client.

**Is there SSR here?**  
Enrollment component is explicitly client-side (`"use client"`). The page itself can still be part of App Router but detection logic runs only in the browser.

---

## License

No explicit license in repository; consider adding one (e.g., MIT) to clarify usage rights.

---

## Quick Reference

| Action       | Command         |
| ------------ | --------------- |
| Install      | `npm install`   |
| Dev          | `npm run dev`   |
| Build        | `npm run build` |
| Start (prod) | `npm start`     |

---

Generated on: 2025-08-19
