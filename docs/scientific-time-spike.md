# Scientific-Time Spike: Mission Planning Without Core Clock Science

## Result

Decan can already preserve a mission-planning relation when an authoritative upstream system supplies the event evidence. The executable case resolves **30 elapsed seconds after eclipse entry** from a versioned `@eclipse-entry` instant and retains the astronomical snapshot that identifies the ephemeris source.

## Mission-Planning Snapshot Profile

Use the existing `astronomicalSnapshot()` and `explicitReference()` boundary when an external flight-dynamics or ephemeris system has already produced the event instant. The snapshot must carry a stable identity, version, authority/source, effective or observed time, declared time scale, and the relevant kernel/model identity. Decan then preserves relations, offsets, windows, exceptions, selection, derivation, and Occurrence evidence; it does not compute the event.

## Current boundary

Current Decan does not model tagged TAI, UTC, GPS, Galileo, TT, or other scientific scales. It does not transform between scales, calculate ephemerides, apply relativistic corrections, or represent a leap-second `:60` value. A generic astronomical snapshot may retain those facts as evidence, but the temporal core must not pretend to interpret them.

## Decision gate

Keep the **Mission-Planning Snapshot Profile** when upstream authorities convert scientific time into a supplied ISO instant before Decan resolution.

Propose a future **Scientific Time Profile** only when Decan itself must compare or transform time scales, preserve leap-second values as temporal primitives, or decide a relation across independently tagged clock domains. That future work requires typed scale-aware instants and explicit conversion-model evidence; it is not a context-enum addition.
