# Code Review Baseline

**Repository:** `karim007king-ship-it/samat-fi-madina`  
**Review base:** `fix/multilingual-main-sync`  
**Review branch:** `chore/engine-architecture-review`  
**Review date:** 2026-11-20  
**Scope:** source layout, runtime boundaries, localization, persistence, import surfaces, offline delivery.

## Repository inventory

| Area | Files | Observations |
|---|---|---|
| Browser shell | `index.html` | CSS is embedded in the HTML shell; classic scripts are loaded in a fixed order. |
| Localization | `i18n.js`, `lang_*.js` | Four locales; fallback to Tunisian; direction and digit formatting are centralized. |
| Story content | `story.js` | 45 chapters and story-specific metadata are coupled to the runtime's expected global names. |
| Runtime | `engine.js` | Approximately 48.6 KB / 1,162 lines; includes state, saves, dialogue, scenes, puzzles, menus and settings. |
| Optional studio | `studio.js` | Import/export and image operations; import was deliberately disabled in the test branch as a security precaution. |
| Audio and effects | `audio.js`, `fx.js` | Separate files, but consume shared runtime globals and extension hooks. |
| Assets | `images.js`, `images2.js` | Image payloads are embedded in JavaScript; `images2.js` is currently empty on the reviewed base and must be checked against lazy-loader expectations. |
| Offline delivery | `sw.js`, `manifest.json` | Service-worker behavior and cache version are part of the release contract. |
| Existing tests | `tests/i18n-runtime.js`, workflow validation | Language/runtime checks exist; settings DOM lifecycle and full browser behavior need explicit coverage. |

## Confirmed review findings

### Architecture and maintainability
- `engine.js` is a large multi-responsibility module. It should be decomposed by subsystem, not rewritten wholesale.
- `index.html` contains the visual stylesheet and script orchestration; CSS extraction should follow runtime stabilization.
- The runtime uses classic-script globals and inline event handlers. Any move to modules must preserve the current loading and callback contracts until migration is complete.
- The story and locale dictionaries are coupled through string keys. Key coverage and placeholder consistency need automated checks.

### Localization and settings
- `setUI()` rebuilds the settings view dynamically and attaches event handlers after rendering.
- Language switching persists the locale and reloads the page. The observed first-entry mismatch requires a browser-level regression test covering the first settings render after a locale change, not only dictionary lookup.
- The current integration branch's `i18n.js` writes locale script tags while `index.html` also declares locale script tags. This duplicate loading should be removed only after the bootstrap contract and tests are updated together.
- Locale fallback can conceal untranslated strings. The audit must report missing keys separately from fallback behavior.

### Security and data integrity
- The studio import path is a trust boundary. SVG, CSS, JSON and image inputs must be validated before they can affect the DOM or persistent storage.
- Save import must validate the game identifier, schema version, chapter/step bounds, trust values, flags, clues and payload size before writing to local storage.
- Dynamic HTML construction must be reviewed at every import-derived or story-derived insertion point. Escaping a label alone is not a complete sanitizer for SVG or CSS.
- Avoid adding broad permissions, remote code, analytics or new third-party runtime packages.

### Offline and deployment
- Service-worker cache names must be app-scoped. Activation must never delete unrelated origin caches.
- A cache version change must be coordinated with the exact asset list and an offline fallback test.
- GitHub Pages and direct local-file behavior differ; release checks must use the deployed HTTP(S) origin as well as a local development server.

## Risk register

| Priority | Risk | Required control |
|---|---|---|
| P0 | Player progress loss during refactor or language switch | Preserve storage keys and test save/load/export/import before and after locale changes. |
| P1 | First-render settings localization mismatch | Browser regression test for each locale, first open and reopen. |
| P1 | Untrusted studio imports reaching DOM/storage | Keep import disabled until schema and content validation are proven. |
| P1 | Service-worker stale/mixed assets | Versioned, app-scoped cache and update/offline tests. |
| P2 | Monolithic runtime slows safe maintenance | Extract one module at a time behind compatibility APIs. |
| P2 | Translation fallback masks incomplete locale coverage | Generate per-locale missing-key and placeholder reports. |
| P2 | Embedded CSS/assets increase change coupling | Extract after runtime tests and preserve URLs/cache behavior. |

## Review status

This document records the baseline and does not claim that the full browser, Android or security audit has passed. Each risk is closed only by a reproducible test and a reviewed code change. The next implementation step is automated repository checks, followed by the settings lifecycle regression test and the smallest safe fix.
