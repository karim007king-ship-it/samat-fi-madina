# Save Integrity Test Matrix

Scope: exercise the existing save validation and import boundary without changing story progression, save keys, or save format.

## Preconditions
- Use a disposable browser profile or copy of the game save.
- Keep an untouched backup before testing imports.
- Run against the current branch and note browser/device and commit SHA.

## State validation
| Case | Input | Expected |
|---|---|---|
| Valid mid-chapter state | valid chapter, step, trust, clues, flags | accepted |
| Chapter out of range | negative or greater than chapter count | rejected |
| Invalid step | negative, non-integer, or > 20000 | rejected |
| Trust boundary | trust < 0, > 10, NaN, string | rejected |
| Clue type/size | non-array, >300 clues, oversized clue text | rejected |
| Unknown clue | clue not in ALLJ | rejected |
| Flags structure | array, excessive keys, invalid key, non-boolean values | rejected |
| Prototype-like keys | constructor, prototype, __proto__ | rejected |
| Card pointer | invalid integer or outside chapter bounds | rejected |
| Error counter | negative, non-finite, or >10000 | rejected |

## Import boundary
- Oversized file (>1.2 MB): reject without writes.
- Invalid JSON: reject without writes.
- Wrong version/game key: reject without writes.
- Non-object data or excessive key count: reject without writes.
- Invalid nested save entry: reject entire import, not partially import.
- Simulate write failure: restore previous values.
- Valid import: create backup, validate, write, reload.

## Persistence regression
- New game, autosave, close/reopen, resume.
- Resume at a chapter transition.
- Save slots 1–3; invalid slot index rejected.
- Snapshot list with malformed entries.
- Ending records restricted to the six known endings.
- Settings values (volume, reduced motion, locale) bounded and persist.
- Export/import round trip preserves progress, clues, flags and settings.

## Test result recording
Record each case as PASS / FAIL / NOT RUN. Do not report the import boundary as secure until all rejection and rollback cases have been executed in a real browser runtime.