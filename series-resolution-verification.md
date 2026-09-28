# Series resolution — verification

Branch `feat/series-resolution-and-weekday-sets`, version `1.1.0`, verified 2026-09-28 on Node v22.23.1. Every step below is agent-run. The release steps (merge, `npm publish`, registry check, tag) are recorded in the PR, not here.

| # | Check | Command / evidence | Result |
|---|---|---|---|
| 1 | Typecheck | `npm run typecheck` | ✅ pass, no errors |
| 2 | Full suite | `npm test -- --cache=false`: 45 files, 206 tests | ✅ pass |
| 3 | Build | `npm run build` | ✅ pass |
| 4 | Pre-build facts (§3) | `series-resolution-benchmarks-pre.md`: all 5 cases behaved as the prompt recorded | ✅ no stop condition |
| 5 | Validation interplay (§4.4) | `validateDocument` accepts `selection` under `repeat(week)` (status `valid`); pinned in `resolve-series.test.ts` | ✅ no stop condition |
| 6 | S1 false absence | grep for `repeatDates` callers and `selection` resolution in `src/`: only `resolve.ts` (its own internal closure). No existing series helper. | ✅ |
| 7 | Post-build cases 1–2 | now exact imports; `resolveSeries` expands them correctly | ✅ |
| 8 | Post-build case 3 | four 2nd Tuesdays: 2026-09-08, 10-13, 11-10, 12-08 | ✅ |
| 9 | Post-build case 4 | 4 occurrences + excluded `["2026-09-22"]` | ✅ |
| 10 | Post-build case 5 | weekly 2026-09-15 .. 2026-12-29 (16 dates) | ✅ |
| 11 | `resolveExpression` unchanged (invariant 1) | cases 3–5 `resolveExpression` outputs equal to pre, compared as parsed JSON; `resolve.ts`, `civil-time.ts`, `identity.ts`, `support-matrix.ts`, `src/canonical`, and `src/validation` have no diff against `90c3235` | ✅ |
| 12 | Byte-identical adapter guard (invariant 1) | `rrule-weekly-sets.test.ts`: 97 pre-existing exact inputs; sha256 of `JSON.stringify` of both the import and the export equals the hashes captured from a clean `90c3235` build. 12 more (monthly from day 31) now fail closed on purpose, asserted separately | ✅ 97/97 import, 97/97 export; 12/12 now fail closed |
| 13 | No host time inputs (invariant 2) | `src/resolution/series.ts` has no `Date.now`, `new Date`, `Intl`, `process.`, `Temporal.Now`, or `toLocale*`; the smoke test shows a missing snapshot yields a `timezone` need | ✅ |
| 14 | Entry parity (invariant 3) | `tests/temporal-export.test.ts` passes with `resolveSeries` and its types exported from both `src/index.ts` and `src/temporal.ts` | ✅ |
| 15 | Import/series closure (invariant 4) | property test: every generated importable rule (WEEKLY sets, MONTHLY ordinals/sets, DAILY+BYDAY) resolves through `resolveSeries` without error; named tests pin the shapes `resolveSeries` rejects (condition, offset, day/year selections, week ordinals, non-`@exdate` exceptions, quarter/elapsed repeats). Reading `importRRule`'s constructors confirms it never emits any of them: it only builds `clock`, civil `repeat(day|week|month|year)`, weekday `selection` (ordinals only under `month`), and `@exdate:` exceptions | ✅ |
| 16 | Docs match behavior (invariant 5) | each new README/conformance claim has a test: weekly sets, DAILY equivalence, the WKST matrix, export/round-trip, date-granular EXDATE, gap/fold, needs, truncation, identity excluding `maxOccurrences`, month-end clamping, and the `docs/examples.md` series example. An untested README hash-parity sentence was removed | ✅ |
| 17 | Property test | `resolve-series.property.test.ts`: 500 runs, seed `20260928`, independent brute-force reference; plus 200 runs over the fixed 2026-12-01..2027-01-31 window. Mutation check: moving week start to Sunday, and not counting EXDATEs toward COUNT, each produced a counterexample | ✅ |
| 18 | Tarball contents | `npm pack --dry-run`: `@rmichaelthomas/decan@1.1.0`, 146 files, including `dist/temporal.js`, `dist/temporal.d.ts`, `dist/resolution/series.js`, and `dist/resolution/series.d.ts`; no benchmark or verification markdown | ✅ |
| 19 | Consumer smoke | temp dir, `npm init -y`, `npm install <tarball>`; `import { importRRule, resolveSeries } from "@rmichaelthomas/decan/temporal"` resolves under the exports map to `dist/temporal.js`; weekly `MO,WE` COUNT=4 → 2026-09-14, 09-16, 09-21, 09-23; installed `exports["./temporal"]` is present | ✅ |

## Deviations from the build prompt

- **`tests/post_c6/rrule-adapter-full-surface.test.ts` was edited, although the prompt lists it as read-only.** Two of its tests asserted the exact 1.0.0 behavior that §5.1 reverses: `WEEKLY;BYDAY=MO,WE,FR` and `WEEKLY;BYDAY=TU` from a Monday failing closed, and `DAILY;INTERVAL=1;BYDAY=MO` failing closed. §5.1 and "the full suite passes unchanged" cannot both hold. The edit is the minimum: those two tests now assert the neighbors that still fail closed (weekly ordinals, and `DAILY` at `INTERVAL=2` with `BYDAY`), and a comment points to the new positive tests. Nothing else in that file changed.
- `package-lock.json`'s root `version` moved to `1.1.0` along with `package.json`, as `npm version` does.
- The benchmark scripts are embedded in the benchmark markdown files rather than committed as separate scripts, since the file inventory lists no script path.
- **Bug fix beyond the prompt (approved by Rob, 2026-09-28):** `MONTHLY`/`YEARLY` RRULEs and monthly/yearly cron triggers whose start day is missing in some period (the 29th–31st, or Feb 29) now fail closed, on import and export. In 1.0.0 they imported as exact, but Decan moved the missing day to month end, while RRULE and cron skip the month. 5xFive's feed parser was showing those fake dates. It already degrades a refused rule to its first instance.
- Also fixed in new code: the series `id` now includes `maxOccurrences`; `resolveSeries` stops at `lifecycle.effectiveUntil`; `docs/examples.md` imports from `@rmichaelthomas/decan`.
