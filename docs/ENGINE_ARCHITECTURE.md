# Engine Architecture

## Current runtime

The application is a browser-first interactive story game. The current runtime is a set of classic scripts loaded in a strict order by the root `index.html`; files share globals rather than using ES modules.

| Current file | Responsibility | Target boundary |
|---|---|---|
| `index.html` | HTML shell, embedded CSS, script order, service-worker registration | `app/index.html` + external stylesheets |
| `i18n.js` | Language selection, translation lookup, locale direction and digits | `src/core/i18n/` |
| `lang_tn.js`, `lang_ar.js`, `lang_fr.js`, `lang_en.js` | Locale dictionaries and locale-specific text rules | `src/content/locales/` |
| `story.js` | Game metadata, chapters, scenes, choices, puzzle data and endings | `src/content/story/` |
| `engine.js` | Runtime state, persistence, rendering, dialogue, puzzles, settings and menus | `src/core/` + `src/features/` |
| `audio.js` | Audio context, ambience, sound effects and controls | `src/features/audio/` |
| `studio.js` | Optional image/story studio, import/export and local media | `src/features/studio/` |
| `fx.js` | Cinematic effects and engine extensions | `src/features/cinematics/` |
| `images.js`, `images2.js` | Embedded image data and lazy image payloads | `assets/characters/`, `assets/backgrounds/` |
| `sw.js` | Offline cache, update lifecycle and request strategy | Root deployment entry until hosting paths are migrated |

## Target structure

The target is a domain-based structure with explicit boundaries:

```text
/
├── index.html                 # stable browser entry point
├── manifest.json
├── sw.js                      # stable service-worker entry point
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── scene.css
│   └── components.css
├── src/
│   ├── core/
│   │   ├── app.js
│   │   ├── events.js
│   │   ├── state/
│   │   ├── storage/
│   │   ├── validation/
│   │   └── i18n/
│   ├── features/
│   │   ├── settings/
│   │   ├── saves/
│   │   ├── studio/
│   │   ├── audio/
│   │   └── cinematics/
│   └── content/
│       ├── story/
│       └── locales/
├── assets/
│   ├── characters/
│   ├── backgrounds/
│   └── icons/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── security/
└── docs/
```

This is a target, not a request to move everything in one commit. Root paths remain stable until the app shell, service worker, offline cache, and GitHub Pages URLs are tested together.

## Dependency rules

1. Core modules must not depend on story-specific content.
2. Content files may depend on documented core contracts, never on DOM implementation details.
3. Features register through the existing `Engine` extension points or a documented event interface; they must not patch unrelated core functions.
4. Locale files contain data and locale rules only. UI code obtains visible labels through the translation API.
5. Storage and import validation are isolated from rendering.
6. The service worker is changed only with a matching cache-version and offline/update regression test.
7. No third-party runtime dependency is added without a documented need.

## Migration rules

- Work only on the dedicated architecture branch.
- Preserve `main`, player progress keys, game ID, story chapter order, endings, asset identifiers and current public URLs.
- Extract one subsystem at a time. Keep a compatibility facade when old globals are still consumed.
- Each extraction must have before/after tests and a runnable browser build.
- Do not minify or mass-reformat source while behavior is being stabilized; reviewable diffs are required.
- Keep a root-level compatibility loader until every target path is verified on desktop and Android browsers.

## Module extraction order

1. Tests and repository contracts.
2. Translation bootstrap and locale dictionaries.
3. Settings UI and language switching.
4. Save validation and storage adapter.
5. Menus and save-slot UI.
6. Puzzle runtime and dialogue flow.
7. Scene renderer and image loading.
8. Audio and cinematic extensions.
9. CSS extraction and asset layout.
10. Service-worker and deployment path cleanup.
