# Consumer Evidence Fixtures

Each real consumer case lives in its own directory under `fixtures/consumer-evidence/`.
The directory must contain a `case.json` file, and may contain an authoring or
canonical `.ti` source file referenced by that JSON.

The corpus is executable evidence, not prose. A case must pin every fact Decan is
allowed to know: reference time, horizon, lifecycle, zone/calendar/locale/custom
context snapshots, reference or observer snapshots, expected candidates, and
derivation plus materialization/replay expectations.

Minimal shape:

```json
{
  "consumer": "example-consumer",
  "intent": "Human-readable intent exactly as supplied by the consumer.",
  "source": {
    "surface": "authoring",
    "textFile": "authoring.ti"
  },
  "resolution": {
    "referenceTime": "2026-08-01T00:00:00Z",
    "horizon": { "kind": "count", "value": 1 },
    "context": [],
    "references": []
  },
  "expected": {
    "validationStatus": "valid",
    "resolutionStatus": "resolved",
    "candidateValues": [],
    "resolutionDerivationKinds": ["resolution_frame"],
    "candidateDerivationKinds": ["explicit_snapshot_evaluation"],
    "needs": [],
    "materialization": {
      "candidateIndex": 0,
      "intentId": "example-intent",
      "intentVersion": 1,
      "recordedAt": "2026-08-01T00:00:01Z",
      "asOfBefore": "2026-08-01T00:00:00Z"
    }
  },
  "observedGaps": []
}
```

Rules for endpoint readiness:

- `resolutionStatus` should be `resolved` for the real consumer happy path.
- `partially_resolved` is not an acceptable endpoint for this corpus.
- `candidateValues` must match the full `ResolvedCandidate.value` list.
- Resolved cases must pin resolution and candidate derivation kinds.
- A resolved case must include `candidateValues`, explicit empty `needs`, and
  `materialization` replay expectations.
- `needs` must be empty unless the fixture is explicitly a negative case.
- `observedGaps` must be empty or explicitly classified as `fixed`,
  `unsupported`, or `deferred`.
- No fixture may depend on ambient locale, host timezone, live polling, cron/RRULE
  loss, Binding, authority, execution, verification, or fulfillment.
