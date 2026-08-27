export type ZonedDateTime = string;

export type SourceSpan = Readonly<{
  start: Readonly<{ line: number; column: number; offset: number }>;
  end: Readonly<{ line: number; column: number; offset: number }>;
}>;

export type Diagnostic = Readonly<{
  severity: "info" | "warning";
  code: string;
  message: string;
  path?: string;
  span?: SourceSpan;
  details?: Readonly<Record<string, unknown>>;
}>;

export type TemporalError = Readonly<{
  category: "syntax" | "interchange" | "validation" | "capability" | "resolution" | "materialization" | "storage";
  code: string;
  message: string;
  path?: string;
  span?: SourceSpan;
  details?: Readonly<Record<string, unknown>>;
  remediation?: "correct_source" | "supply_dependency" | "select_candidate" | "upgrade_format";
}>;

export type OperationResult<T> =
  | Readonly<{ ok: true; value: T; diagnostics?: ReadonlyArray<Diagnostic> }>
  | Readonly<{ ok: false; errors: ReadonlyArray<TemporalError>; diagnostics?: ReadonlyArray<Diagnostic> }>;

export type Identifier = string;
export type ReferenceId = `@${string}`;
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type LifecycleStatus = "active" | "suspended" | "superseded" | "retired";

export type ClockValue = Readonly<{ kind: "clock"; hour: number; minute: number; second?: number }>;
export type DateValue = Readonly<{ kind: "date"; calendar: "iso8601"; year: number; month: number; day: number }>;
export type SemanticPoint = Readonly<{ kind: "semantic_point"; name: string }>;
export type SemanticWindow = Readonly<{ kind: "semantic_window"; name: string }>;
export type ExplicitWindow = Readonly<{ kind: "explicit_window"; start: ClockValue; end: ClockValue }>;
export type WindowValue = SemanticWindow | ExplicitWindow;

export type DurationMode = "elapsed" | "calendar" | "business";
export type TemporalAmount = Readonly<{
  value: number;
  unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year" | "business_day" | "business_hour";
  mode: DurationMode;
}>;

export type Anchor = Readonly<{
  kind: "event" | "state" | "participant" | "context" | "expression";
  reference: ReferenceId;
}>;
export type PredicateReference = Anchor;

export type TemporalSelector =
  | Readonly<{ kind: "ordinal"; value: 1 | 2 | 3 | 4 | 5 | -1 }>
  | Readonly<{ kind: "earliest" }>
  | Readonly<{ kind: "latest" }>
  | Readonly<{ kind: "next" }>
  | Readonly<{ kind: "previous" }>
  | Readonly<{ kind: "nearest" }>
  | Readonly<{ kind: "all" }>;

export type TemporalFilter =
  | Readonly<{ kind: "weekday"; value: Weekday }>
  | Readonly<{ kind: "business_day" }>
  | Readonly<{ kind: "date"; value: DateValue }>
  | Readonly<{ kind: "available_slot" }>
  | Readonly<{ kind: "custom"; reference: ReferenceId }>;

export type PointExpression = Readonly<{ kind: "point"; value: ClockValue | DateValue | SemanticPoint }>;
export type WindowExpression = Readonly<{ kind: "window"; value: WindowValue }>;
export type RepeatExpression = Readonly<{
  kind: "repeat";
  every: number;
  unit: "second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";
  mode?: "civil" | "elapsed";
}>;
export type SelectionExpression = Readonly<{ kind: "selection"; filter?: TemporalFilter; selector: TemporalSelector }>;
export type OffsetExpression = Readonly<{ kind: "offset"; amount: TemporalAmount }>;
export type DurationExpression = Readonly<{
  kind: "duration";
  amount: TemporalAmount;
  role?: "condition_minimum" | "window_span" | "validity_span";
}>;
export type RelationExpression = Readonly<{
  kind: "relation";
  relation: "before" | "after";
  anchor: Anchor;
  offset?: OffsetExpression;
}>;
export type ConditionExpression = Readonly<{
  kind: "condition";
  mode: "gate" | "trigger";
  predicate: PredicateReference;
  minimumDuration?: DurationExpression;
}>;
export type BoundaryExpression = Readonly<{
  kind: "boundary";
  operator: "before" | "by" | "until" | "within";
  value: ClockValue | DateValue | SemanticPoint | Anchor | TemporalAmount;
}>;
export type ExceptionExpression = Readonly<{ kind: "exception"; predicate: PredicateReference; effect: "suppress" }>;
export type AdjustmentExpression = Readonly<{
  kind: "adjustment";
  when: PredicateReference;
  operation:
    | Readonly<{ kind: "move"; direction: "forward" | "backward"; target: TemporalExpression }>
    | Readonly<{ kind: "substitute"; target: TemporalExpression }>
    | Readonly<{ kind: "preserve"; aspect: "local_civil_time" | "anchor_relation" }>;
  precedence?: number;
}>;
export type CompoundExpression = Readonly<{ kind: "compound"; expressions: ReadonlyArray<TemporalExpression> }>;

export type TemporalExpression =
  | PointExpression
  | WindowExpression
  | RepeatExpression
  | SelectionExpression
  | RelationExpression
  | OffsetExpression
  | DurationExpression
  | ConditionExpression
  | BoundaryExpression
  | ExceptionExpression
  | AdjustmentExpression
  | CompoundExpression;

export type SourceKind = "natural_language" | "voice" | "cli" | "api" | "agent" | "imported_cron" | "imported_rrule" | "canonical_document";
export type ProvenanceKind = "explicit" | "derived" | "inferred" | "defaulted" | "personalized" | "confirmed" | "imported";
export type Provenance = Readonly<{ kind: ProvenanceKind; source?: string; confidence?: number; evidence?: ReadonlyArray<string> }>;
export type SourceRecord = Readonly<{ kind: SourceKind; value: string; actor?: string; createdAt: string }>;
export type InterpretationClaim = Readonly<{ path: string; value: unknown; provenance: Provenance }>;
export type UnresolvedClaim = Readonly<{
  sourceText: string;
  kind: "reference" | "context" | "ambiguity" | "condition";
  candidates?: ReadonlyArray<unknown>;
  confidence?: number;
}>;
export type InterpretationRecord = Readonly<{ claims: ReadonlyArray<InterpretationClaim>; unresolved: ReadonlyArray<UnresolvedClaim> }>;
export type ContextKind = "timezone" | "locale" | "calendar" | "location" | "participant" | "availability" | "astronomical" | "custom";
export type ContextBinding = Readonly<{ name?: string; reference: ReferenceId; kind: ContextKind }>;
export type ReferenceRecord = Readonly<{
  id: Identifier;
  kind: "event" | "state" | "participant" | "context" | "custom";
  source?: string;
  status: "unresolved" | "resolved" | "ambiguous";
  target?: string;
  provenance?: Provenance;
}>;
export type IntentLifecycle = Readonly<{
  status: LifecycleStatus;
  effectiveFrom?: DateValue;
  effectiveUntil?: DateValue;
  version: number;
  supersedes?: string;
}>;
export type TemporalIntent = Readonly<{
  id: Identifier;
  source: SourceRecord;
  interpretation: InterpretationRecord;
  expression: TemporalExpression;
  references?: ReadonlyArray<ReferenceRecord>;
  context?: ReadonlyArray<ContextBinding>;
  lifecycle: IntentLifecycle;
}>;

export type NormalizedDocument = Readonly<{
  intentId?: Identifier;
  source?: SourceRecord;
  expression: CompoundExpression;
  references: ReadonlyArray<ReferenceRecord>;
  context: ReadonlyArray<ContextBinding>;
  lifecycle?: IntentLifecycle;
  spans?: Readonly<Record<string, SourceSpan>>;
}>;

export type HashIdentity = `sha256:${string}`;
export type CanonicalizedValue = Readonly<{
  document: NormalizedDocument;
  canonicalText: string;
  expressionHash: HashIdentity;
  intentVersionHash?: HashIdentity;
}>;

export type ParseRequest = Readonly<{ text: string; surface: "authoring" | "canonical" }>;
export type CanonicalizeRequest = ParseRequest;
export type PrintRequest = Readonly<{ document: NormalizedDocument }>;
export type SerializeRequest = Readonly<{ record: TemporalExpression | TemporalIntent }>;
export type DeserializeRequest = Readonly<{ bytes: string | Uint8Array }>;
export type ValidateRequest = Readonly<{ document: NormalizedDocument }>;
export type ResolveRequest = Readonly<{ expression: TemporalExpression; referenceTime: ZonedDateTime; horizon: ResolutionHorizon; lifecycle?: IntentLifecycle; references?: ReadonlyArray<ReferenceSnapshot>; context?: ReadonlyArray<ContextSnapshot> }>;
export type MaterializeRequest = Readonly<{ intentId: string; intentVersion: number; resolution: TemporalResolution; candidateId: string; recordedAt: ZonedDateTime; occurrenceKey?: string }>;
export type OccurrenceQuery = Readonly<Record<string, unknown>>;
export type GetOccurrenceRequest = Readonly<{ id: string }>;
export type InspectRequest = Readonly<{ value: TemporalExpression | TemporalResolution | Occurrence }>;
export type ExplainRequest = InspectRequest;
export type CapabilityRequest = Readonly<{ expression?: TemporalExpression; operation?: TemporalOperation }>;

export type ParseResult = OperationResult<NormalizedDocument>;
export type CanonicalizeResult = OperationResult<CanonicalizedValue>;
export type PrintResult = OperationResult<Readonly<{ text: string }>>;
export type SerializeResult = OperationResult<Readonly<{ envelope: InterchangeEnvelope; bytes: string; expressionHash: HashIdentity; intentVersionHash?: HashIdentity }>>;
export type DeserializeResult = OperationResult<InterchangeEnvelope>;
export type ValidateResult = OperationResult<Readonly<{ status: "valid" | "invalid"; errors: ReadonlyArray<TemporalError>; unresolvedDependencies: ReadonlyArray<DeclaredDependency> }>>;
export type ResolveResult = OperationResult<TemporalResolution>;
export type MaterializeResult = OperationResult<Readonly<{ occurrence: Occurrence; disposition: "created" | "existing" }>>;
export type OccurrenceQueryResult = OperationResult<Page<StoredOccurrence>>;
export type GetOccurrenceResult = OperationResult<StoredOccurrence>;
export type InspectResult = OperationResult<Readonly<Record<string, unknown>>>;
export type ExplainResult = OperationResult<Readonly<{ derivation: ReadonlyArray<DerivationStep>; needs: ReadonlyArray<ResolutionNeed> }>>;
export type CapabilityResult = OperationResult<CapabilityManifest>;

export interface TemporalRuntime {
  parse(request: ParseRequest): ParseResult;
  canonicalize(request: CanonicalizeRequest): CanonicalizeResult;
  print(request: PrintRequest): PrintResult;
  validate(request: ValidateRequest): ValidateResult;
  serialize(request: SerializeRequest): SerializeResult;
  deserialize(request: DeserializeRequest): DeserializeResult;
  resolve(request: ResolveRequest): ResolveResult;
  materialize(request: MaterializeRequest): MaterializeResult;
  queryOccurrences(request: OccurrenceQuery): OccurrenceQueryResult;
  getOccurrence(request: GetOccurrenceRequest): GetOccurrenceResult;
  inspect(request: InspectRequest): InspectResult;
  explain(request: ExplainRequest): ExplainResult;
  capabilities(request?: CapabilityRequest): CapabilityResult;
}

export type ResolutionHorizon = Readonly<{ kind: "count"; value: number }> | Readonly<{ kind: "until"; value: ZonedDateTime }> | Readonly<{ kind: "duration"; value: TemporalAmount }>;
export type ReferenceSnapshot = Readonly<{ id: ReferenceId; version: string; value: unknown }>;
export type ContextSnapshot = Readonly<{ kind: ContextKind; id: string; version: string; value: unknown }>;
export type ResolutionNeed = Readonly<{ kind: ContextKind | "reference" | "feature" | "adjustment_policy"; id?: string; requiredBy: string; reason: string }>;
export type TemporalCandidate = Readonly<{ kind: "point_candidate" | "window_candidate" | "conditional_candidate"; value: unknown }>;
export type DerivationStep = Readonly<{ kind: string; inputs: ReadonlyArray<string>; output: string }>;
export type ResolvedCandidate = Readonly<{ id: string; value: TemporalCandidate; derivation: ReadonlyArray<DerivationStep> }>;
export type TemporalResolution = Readonly<{
  id: HashIdentity;
  status: "resolved" | "partially_resolved" | "unresolved" | "conflicted";
  candidates: ReadonlyArray<ResolvedCandidate>;
  needs: ReadonlyArray<ResolutionNeed>;
  assumptions: ReadonlyArray<Provenance>;
  contextUsed: ReadonlyArray<ContextSnapshot>;
  horizon: ResolutionHorizon;
  derivation: ReadonlyArray<DerivationStep>;
}>;
export type DeclaredDependency = Readonly<{ kind: string; id?: string }>;
export type OccurrencePhase = "materialized" | "ready" | "cancelled" | "closed";
export type Occurrence = Readonly<{ id: string; intentId: string; intentVersion: number; occurrenceKey: string; phase: OccurrencePhase }>;
export type OccurrenceEvent = Readonly<{ id: string; kind: "materialized" | "ready" | "cancelled" | "closed"; recordedAt: ZonedDateTime }>;
export type StoredOccurrence = Readonly<{ occurrence: Occurrence; history: ReadonlyArray<OccurrenceEvent> }>;
export type Page<T> = Readonly<{ items: ReadonlyArray<T>; nextCursor?: string }>;
export type TemporalOperation = keyof TemporalRuntime;
export type FeatureSupport = "exact" | "partial" | "pending" | "unsupported";
export type CapabilityManifest = Readonly<{ profile: "syntax-interchange" | "temporal-core" | "durable-occurrences"; operations: Readonly<Record<TemporalOperation, FeatureSupport>>; features: ReadonlyArray<Readonly<{ id: string; support: Readonly<Partial<Record<TemporalOperation, FeatureSupport>>> }>> }>;

export type InterchangeEnvelope = Readonly<{
  format: "temporal-intent";
  version: "0.1";
  type: "intent" | "expression" | "interpretation" | "resolution" | "occurrence";
  intent?: TemporalIntent;
  expression?: TemporalExpression;
}>;
