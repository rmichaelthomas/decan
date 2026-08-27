import type { DeserializeRequest, DeserializeResult, InterchangeEnvelope, OperationResult, SerializeRequest, SerializeResult, TemporalExpression, TemporalIntent } from "../model/types.js";
import { canonicalJson, sha256 } from "../canonical/identity.js";
import { normalizeDocument } from "../syntax/normalize.js";

const error = <T>(message: string): OperationResult<T> => ({ ok: false, errors: [{ category: "interchange", code: "TI_INTERCHANGE", message }] });
const object = (value: unknown): Record<string, unknown> | undefined => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const only = (value: Record<string, unknown>, fields: readonly string[]) => Object.keys(value).every((key) => fields.includes(key));
const string = (value: unknown): value is string => typeof value === "string";
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const hasReference = (value: unknown): boolean => { const item = object(value); return item !== undefined && string(item.reference); };
const normalizeExpression = (expression: TemporalExpression): TemporalExpression => expression.kind === "compound" ? normalizeDocument({ expression, references: [], context: [] }).expression : expression;

function decodeValue(value: unknown): unknown | undefined {
  const item = object(value); if (!item || !string(item.kind)) return undefined;
  if (item.kind === "clock" && only(item, ["kind", "hour", "minute", "second"]) && number(item.hour) && number(item.minute) && (item.second === undefined || number(item.second))) return item;
  if (item.kind === "date" && only(item, ["kind", "calendar", "year", "month", "day"]) && item.calendar === "iso8601" && number(item.year) && number(item.month) && number(item.day)) return item;
  if ((item.kind === "semantic_point" || item.kind === "semantic_window") && only(item, ["kind", "name"]) && string(item.name)) return item;
  if (item.kind === "explicit_window" && only(item, ["kind", "start", "end"]) && decodeValue(item.start) && decodeValue(item.end)) return item;
  return undefined;
}

function decodeAmount(value: unknown): unknown | undefined {
  const item = object(value); if (!item || !only(item, ["value", "unit", "mode"]) || !number(item.value) || !string(item.unit) || !string(item.mode)) return undefined;
  const units = ["second", "minute", "hour", "day", "week", "month", "quarter", "year", "business_day", "business_hour"];
  return units.includes(item.unit) && ["elapsed", "calendar", "business"].includes(item.mode) ? item : undefined;
}

function decodeSelector(value: unknown): boolean {
  const item = object(value); if (!item || !string(item.kind)) return false;
  if (["earliest", "latest", "next", "previous", "nearest", "all"].includes(item.kind)) return only(item, ["kind"]);
  return item.kind === "ordinal" && only(item, ["kind", "value"]) && number(item.value) && [1, 2, 3, 4, 5, -1].includes(item.value);
}

function decodeFilter(value: unknown): boolean {
  const item = object(value); if (!item || !string(item.kind)) return false;
  if (["business_day", "available_slot"].includes(item.kind)) return only(item, ["kind"]);
  if (item.kind === "weekday") return only(item, ["kind", "value"]) && string(item.value) && ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(item.value);
  if (item.kind === "date") return only(item, ["kind", "value"]) && decodeValue(item.value) !== undefined;
  return item.kind === "custom" && only(item, ["kind", "reference"]) && string(item.reference);
}

function decodeAdjustmentOperation(value: unknown): boolean {
  const item = object(value); if (!item || !string(item.kind)) return false;
  if (item.kind === "move") return only(item, ["kind", "direction", "target"]) && (item.direction === "forward" || item.direction === "backward") && decodeExpression(item.target) !== undefined;
  if (item.kind === "substitute") return only(item, ["kind", "target"]) && decodeExpression(item.target) !== undefined;
  return item.kind === "preserve" && only(item, ["kind", "aspect"]) && (item.aspect === "local_civil_time" || item.aspect === "anchor_relation");
}

function decodeExpression(value: unknown): TemporalExpression | undefined {
  const item = object(value); if (!item || !string(item.kind)) return undefined;
  if (item.kind === "compound" && only(item, ["kind", "expressions"]) && Array.isArray(item.expressions)) { const expressions = item.expressions.map(decodeExpression); return expressions.every(Boolean) ? item as TemporalExpression : undefined; }
  if (item.kind === "point" && only(item, ["kind", "value"]) && decodeValue(item.value)) return item as TemporalExpression;
  if (item.kind === "window" && only(item, ["kind", "value"]) && decodeValue(item.value)) return item as TemporalExpression;
  if (item.kind === "repeat" && only(item, ["kind", "every", "unit", "mode"]) && number(item.every) && string(item.unit) && ["day", "week", "month", "quarter", "year"].includes(item.unit) && (item.mode === undefined || item.mode === "civil" || item.mode === "elapsed")) return item as TemporalExpression;
  if (item.kind === "selection" && only(item, ["kind", "filter", "selector"]) && decodeSelector(item.selector) && (item.filter === undefined || decodeFilter(item.filter))) return item as TemporalExpression;
  if (item.kind === "offset" && only(item, ["kind", "amount"]) && decodeAmount(item.amount)) return item as TemporalExpression;
  if (item.kind === "duration" && only(item, ["kind", "amount", "role"]) && decodeAmount(item.amount)) return item as TemporalExpression;
  if (item.kind === "relation" && only(item, ["kind", "relation", "anchor", "offset"]) && (item.relation === "before" || item.relation === "after") && hasReference(item.anchor) && (item.offset === undefined || decodeExpression(item.offset))) return item as TemporalExpression;
  if (item.kind === "condition" && only(item, ["kind", "mode", "predicate", "minimumDuration"]) && (item.mode === "gate" || item.mode === "trigger") && hasReference(item.predicate) && (item.minimumDuration === undefined || decodeExpression(item.minimumDuration))) return item as TemporalExpression;
  if (item.kind === "boundary" && only(item, ["kind", "operator", "value"]) && ["before", "by", "until", "within"].includes(String(item.operator)) && (decodeValue(item.value) || decodeAmount(item.value) || (object(item.value) && string(object(item.value)!.reference)))) return item as TemporalExpression;
  if (item.kind === "exception" && only(item, ["kind", "predicate", "effect"]) && item.effect === "suppress" && hasReference(item.predicate)) return item as TemporalExpression;
  if (item.kind === "adjustment" && only(item, ["kind", "when", "operation", "precedence"]) && hasReference(item.when) && decodeAdjustmentOperation(item.operation) && (item.precedence === undefined || (number(item.precedence) && Number.isInteger(item.precedence) && item.precedence > 0))) return item as TemporalExpression;
  return undefined;
}

export function serializeInterchange(request: SerializeRequest): SerializeResult {
  const record = request.record;
  const normalizedRecord = "source" in record ? { ...(record as TemporalIntent), expression: normalizeExpression((record as TemporalIntent).expression) } : normalizeExpression(record as TemporalExpression);
  const envelope: InterchangeEnvelope = "source" in normalizedRecord ? { format: "temporal-intent", version: "0.1", type: "intent", intent: normalizedRecord as TemporalIntent } : { format: "temporal-intent", version: "0.1", type: "expression", expression: normalizedRecord as TemporalExpression };
  const bytes = canonicalJson(envelope);
  const expression = envelope.type === "expression" ? envelope.expression! : envelope.intent!.expression;
  return { ok: true, value: { envelope, bytes, expressionHash: sha256(expression), ...(envelope.type === "intent" ? { intentVersionHash: sha256(envelope.intent) } : {}) } };
}

export function deserializeInterchange(request: DeserializeRequest): DeserializeResult {
  let raw: unknown;
  try { raw = JSON.parse(typeof request.bytes === "string" ? request.bytes : new TextDecoder().decode(request.bytes)); } catch { return error("interchange bytes are not valid JSON"); }
  const envelope = object(raw);
  if (!envelope || !only(envelope, ["format", "version", "type", "intent", "expression"]) || envelope.format !== "temporal-intent" || envelope.version !== "0.1" || !string(envelope.type)) return error("unsupported or malformed interchange envelope");
  if (envelope.type === "expression" && Object.keys(envelope).every((key) => ["format", "version", "type", "expression"].includes(key))) { const expression = decodeExpression(envelope.expression); return expression ? { ok: true, value: { format: "temporal-intent", version: "0.1", type: "expression", expression: normalizeExpression(expression) } } : error("invalid or unknown semantic expression"); }
  if (envelope.type === "intent" && Object.keys(envelope).every((key) => ["format", "version", "type", "intent"].includes(key))) {
    const intent = object(envelope.intent); const expression = intent && decodeExpression(intent.expression);
    const source = intent && object(intent.source); const interpretation = intent && object(intent.interpretation); const lifecycle = intent && object(intent.lifecycle);
    const valid = intent && only(intent, ["id", "source", "interpretation", "expression", "context", "references", "lifecycle"]) && string(intent.id) && expression && source && only(source, ["kind", "value", "actor", "createdAt"]) && string(source.kind) && string(source.value) && string(source.createdAt) && interpretation && only(interpretation, ["claims", "unresolved"]) && Array.isArray(interpretation.claims) && Array.isArray(interpretation.unresolved) && lifecycle && only(lifecycle, ["status", "effectiveFrom", "effectiveUntil", "version", "supersedes"]) && string(lifecycle.status) && number(lifecycle.version) && Array.isArray(intent.context) && Array.isArray(intent.references);
    if (!valid) return error("invalid or unknown semantic intent");
    return { ok: true, value: { format: "temporal-intent", version: "0.1", type: "intent", intent: { ...(intent as TemporalIntent), expression: normalizeExpression(expression) } } };
  }
  return error("unsupported interchange record type or fields");
}
