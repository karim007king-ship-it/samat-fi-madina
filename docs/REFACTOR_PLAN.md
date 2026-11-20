# Refactor and Verification Plan

## Definition of done

A change is complete only when:
- all four locales render their settings labels on the first opening after a language change;
- language switching does not reset story progress or save slots;
- all 45 chapters, choices, puzzles and six endings remain reachable;
- no locale contains unintended fallback strings in the audited UI/content key set;
- save import rejects malformed, oversized and cross-game data without changing existing saves;
- offline startup and service-worker update both work;
- no new console errors appear in the supported mobile browser test;
- `main` and the original branch remain unchanged until an explicitly reviewed merge.

## Work stages

### Stage A — Baseline and safeguards
- Record source inventory and ownership boundaries.
- Add repeatable static and runtime checks.
- Capture storage-key and content contracts.
- Confirm the active branch and preserve all existing feature branches.

### Stage B — Localization and settings
- Make locale loading deterministic; remove duplicate script loading.
- Centralize settings labels and all dynamic UI strings through `TR()`.
- Re-render the settings screen from the active locale without stale DOM references.
- Verify RTL/LTR, language name, digits and first-entry behavior on all four locales.

### Stage C — Persistence and security
- Isolate storage access behind a small adapter.
- Validate saves before import and before resume.
- Keep studio library import disabled until untrusted SVG/CSS handling is safe.
- Add tests for corrupt JSON, wrong game ID, invalid chapter, invalid trust, oversized strings and malformed flags.

### Stage D — Runtime decomposition
- Extract settings, save slots, puzzles, dialogue, scene rendering and audio in that order.
- Retain compatibility wrappers for the old global API.
- Do not alter story data or game outcomes during extraction.

### Stage E — Presentation and delivery
- Extract embedded CSS into the styles directory.
- Separate large image payloads from executable JavaScript.
- Update the service-worker manifest and cache version atomically.
- Verify GitHub Pages paths, offline startup and mobile layout.

## Required test matrix

| Dimension | Cases |
|---|---|
| Locale | `tn`, `ar`, `fr`, `en` |
| Settings lifecycle | first open after switch, close/reopen, switch repeatedly, reload |
| Direction | RTL for Tunisian/Arabic; LTR for French/English |
| Progress | fresh game, existing save, save slot, export/import, resume |
| Content | 45 chapters, all puzzle types, six endings |
| Delivery | online, offline after first visit, service-worker update |
| Security | malformed save, wrong game, invalid values, hostile SVG/CSS payload |
| Devices | desktop Chromium and Android browser |

## Change policy

- One logical subsystem per commit.
- No broad search-and-replace across story or locale content.
- No file move and behavior change in the same commit.
- Keep a rollback point before each extraction.
- PRs remain draft until the automated checks and manual browser test pass.
