import type {
  AdjustmentExpression, Anchor, BoundaryExpression, ClockValue, CompoundExpression, ConditionExpression,
  ContextBinding, DateValue, ExceptionExpression, Identifier, IntentLifecycle, NormalizedDocument,
  OffsetExpression, OperationResult, ParseRequest, PointExpression, ReferenceId, ReferenceRecord,
  RelationExpression, RepeatExpression, SelectionExpression, SemanticPoint, TemporalAmount,
  TemporalExpression, TemporalFilter, TemporalSelector, WindowExpression, SourceRecord
} from "../model/types.js";
import { normalizeDocument } from "./normalize.js";

type Line = { readonly indent: number; readonly text: string; readonly line: number };

function stripComment(raw: string): string {
  let quoted = false; let escaped = false;
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]!;
    if (escaped) { escaped = false; continue; }
    if (character === "\\" && quoted) { escaped = true; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "#" && !quoted) return raw.slice(0, index);
  }
  return raw;
}

const fail = <T>(line: number, message: string): OperationResult<T> => ({
  ok: false,
  errors: [{ category: "syntax", code: "TI_SYNTAX", message, span: { start: { line, column: 1, offset: 0 }, end: { line, column: 1, offset: 0 } } }]
});

const reference = (value: string): ReferenceId | undefined => /^@[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/.test(value) ? value as ReferenceId : undefined;
const identifier = (value: string): Identifier | undefined => /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/.test(value) ? value : undefined;

function linesFor(request: ParseRequest): OperationResult<ReadonlyArray<Line>> {
  if (request.surface === "canonical" && request.text.includes("\r")) return fail(1, "canonical text uses LF line endings only");
  const text = request.surface === "authoring" ? request.text.replace(/\r\n?/g, "\n") : request.text;
  const lines: Line[] = [];
  for (const [index, raw] of text.split("\n").entries()) {
    if (/\t/.test(raw)) return fail(index + 1, "tabs are not valid indentation");
    const withoutComment = stripComment(raw);
    if (!withoutComment.trim()) continue;
    if (/[\[\]{}?~!]/.test(withoutComment)) return fail(index + 1, "reserved punctuation is not valid in v0.1 source");
    const match = /^( *)(.*)$/.exec(withoutComment)!;
    if (match[1].length % 2 !== 0) return fail(index + 1, "indentation must use two spaces per level");
    lines.push({ indent: match[1].length / 2, text: match[2].trimEnd(), line: index + 1 });
  }
  return { ok: true, value: lines };
}

function clock(value: string, surface: ParseRequest["surface"]): ClockValue | SemanticPoint | undefined {
  if (["noon", "midnight", "sunrise", "sunset"].includes(value)) return { kind: "semantic_point", name: value };
  let source = value;
  if (surface === "authoring") {
    const ampm = /^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/.exec(value);
    if (ampm) {
      let hour = Number(ampm[1]);
      if (hour < 1 || hour > 12) return undefined;
      if (ampm[3].toLowerCase() === "pm" && hour !== 12) hour += 12;
      if (ampm[3].toLowerCase() === "am" && hour === 12) hour = 0;
      return { kind: "clock", hour, minute: Number(ampm[2] ?? "0") };
    }
  }
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(source);
  if (!match) return undefined;
  const hour = Number(match[1]); const minute = Number(match[2]); const second = match[3] === undefined ? undefined : Number(match[3]);
  if (hour > 23 || minute > 59 || (second !== undefined && second > 59)) return undefined;
  return second === undefined ? { kind: "clock", hour, minute } : { kind: "clock", hour, minute, second };
}

function date(value: string): DateValue | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return { kind: "date", calendar: "iso8601", year, month, day };
}

function amount(value: string): TemporalAmount | undefined {
  const match = /^(\d+) (second|minute|hour|day|week|month|quarter|year|business hour|business day)s?(?: (elapsed|calendar))?$/.exec(value);
  if (!match || Number(match[1]) < 1) return undefined;
  const raw = match[2].replace(" ", "_") as TemporalAmount["unit"];
  const mode = raw === "business_day" || raw === "business_hour" ? "business" : match[3] as TemporalAmount["mode"] | undefined;
  if (!mode) return undefined;
  const invalid = (mode === "elapsed" && !["second", "minute", "hour", "day", "week"].includes(raw)) || (mode === "calendar" && !["day", "week", "month", "quarter", "year"].includes(raw));
  return invalid ? undefined : { value: Number(match[1]), unit: raw, mode };
}

function selection(value: string): SelectionExpression | undefined {
  const weekday = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.exec(value);
  if (weekday) return { kind: "selection", selector: { kind: "all" }, filter: { kind: "weekday", value: weekday[1].toLowerCase() as TemporalFilter extends { value: infer V } ? V : never } };
  const ordinal = /^(first|second|third|fourth|fifth|last) (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.exec(value);
  if (ordinal) {
    const values: Record<string, 1 | 2 | 3 | 4 | 5 | -1> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, last: -1 };
    return { kind: "selection", selector: { kind: "ordinal", value: values[ordinal[1]]! }, filter: { kind: "weekday", value: ordinal[2].toLowerCase() as never } };
  }
  if (value === "last business day") return { kind: "selection", selector: { kind: "ordinal", value: -1 }, filter: { kind: "business_day" } };
  if (value === "earliest available slot") return { kind: "selection", selector: { kind: "earliest" }, filter: { kind: "available_slot" } };
  if (value === "latest available slot") return { kind: "selection", selector: { kind: "latest" }, filter: { kind: "available_slot" } };
  if (value === "next business day") return { kind: "selection", selector: { kind: "next" }, filter: { kind: "business_day" } };
  if (value === "previous business day") return { kind: "selection", selector: { kind: "previous" }, filter: { kind: "business_day" } };
  return undefined;
}

function parsePoint(value: string, surface: ParseRequest["surface"]): PointExpression | undefined {
  return date(value) ? { kind: "point", value: date(value)! } : clock(value, surface) ? { kind: "point", value: clock(value, surface)! } : undefined;
}

function parseWindow(value: string, surface: ParseRequest["surface"]): WindowExpression | undefined {
  const bounds = /^(.+) to (.+)$/.exec(value);
  if (bounds) {
    const start = clock(bounds[1], surface); const end = clock(bounds[2], surface);
    if (!start || !end || start.kind !== "clock" || end.kind !== "clock") return undefined;
    return { kind: "window", value: { kind: "explicit_window", start, end } };
  }
  if (["morning", "afternoon", "evening", "night"].includes(value)) return { kind: "window", value: { kind: "semantic_window", name: value } };
  const ref = reference(value); return ref ? { kind: "window", value: { kind: "semantic_window", name: ref } } : undefined;
}

function parseRepeat(value: string, surface: ParseRequest["surface"]): RepeatExpression | undefined {
  const match = /^(?:(\d+) )?(second|minute|hour|day|week|month|quarter|year)s?(?: (elapsed))?$/.exec(value);
  if (!match) return undefined;
  const every = Number(match[1] ?? "1"); const unit = match[2] as RepeatExpression["unit"];
  if (every < 1 || (["second", "minute", "hour"].includes(unit) && !match[3]) || (match[3] && !["second", "minute", "hour", "day", "week"].includes(unit))) return undefined;
  if (surface === "canonical" && ((every === 1 && match[1] !== undefined) || (every > 1 && !value.includes(`${unit}s`)))) return undefined;
  return match[3] ? { kind: "repeat", every, unit, mode: "elapsed" } : { kind: "repeat", every, unit, mode: "civil" };
}

function parseAdjustment(line: Line, children: ReadonlyArray<Line>): AdjustmentExpression | undefined {
  const when = children.find((child) => child.text.startsWith("when "))?.text.slice(5);
  const ref = when ? reference(when) : undefined;
  const precedenceLine = children.find((child) => child.text.startsWith("precedence "))?.text.slice(11);
  const operationLine = children.find((child) => /^(move |substitute |preserve )/.test(child.text))?.text;
  if (!ref || !operationLine) return undefined;
  const precedence = precedenceLine === undefined ? undefined : Number(precedenceLine);
  if (precedence !== undefined && (!Number.isInteger(precedence) || precedence < 1)) return undefined;
  let operation: AdjustmentExpression["operation"] | undefined;
  const move = /^move (forward|backward) to (.+)$/.exec(operationLine);
  if (move) { const target = selection(move[2]); if (target) operation = { kind: "move", direction: move[1] as "forward" | "backward", target }; }
  const preserve = /^preserve (local-civil-time|anchor-relation)$/.exec(operationLine);
  if (preserve) operation = { kind: "preserve", aspect: preserve[1].replaceAll("-", "_") as "local_civil_time" | "anchor_relation" };
  const substitute = /^substitute (point|window|select) (.+)$/.exec(operationLine);
  if (substitute) {
    const target = substitute[1] === "point" ? parsePoint(substitute[2], "canonical") : substitute[1] === "window" ? parseWindow(substitute[2], "canonical") : selection(substitute[2]);
    if (target) operation = { kind: "substitute", target };
  }
  if (!operation) return undefined;
  return precedence === undefined ? { kind: "adjustment", when: { kind: "event", reference: ref }, operation } : { kind: "adjustment", when: { kind: "event", reference: ref }, operation, precedence };
}

export function parseDocument(request: ParseRequest): OperationResult<NormalizedDocument> {
  const prepared = linesFor(request); if (!prepared.ok) return prepared;
  const lines = prepared.value;
  if (lines.length === 0) return fail(1, "a document must contain a time block");
  const top = lines.filter((line) => line.indent === 0);
  const time = top.find((line) => line.text === "time");
  if (!time) return fail(1, "a document must contain one time block");
  const expressions: TemporalExpression[] = [];
  const references: ReferenceRecord[] = []; const context: ContextBinding[] = [];
  let intentId: Identifier | undefined; let lifecycle: IntentLifecycle | undefined; let source: SourceRecord | undefined;
  for (let i = 0; i < top.length; i += 1) {
    const line = top[i]!; const end = top[i + 1]?.line ?? Number.MAX_SAFE_INTEGER;
    const children = lines.filter((item) => item.line > line.line && item.line < end && item.indent === 1);
    if (line.text.startsWith("intent ")) { const id = identifier(line.text.slice(7)); if (!id) return fail(line.line, "invalid intent identifier"); intentId = id; continue; }
    if (line.text === "source") {
      const kind = children.find((child) => child.text.startsWith("kind "))?.text.slice(5);
      const value = children.find((child) => child.text.startsWith("value "))?.text.slice(6);
      const createdAt = children.find((child) => child.text.startsWith("created-at "))?.text.slice(11);
      const actor = children.find((child) => child.text.startsWith("actor "))?.text.slice(6);
      const sourceKinds = ["natural_language", "voice", "cli", "api", "agent", "imported_cron", "imported_rrule", "canonical_document"];
      const decoded = (raw: string | undefined) => raw && /^"(?:[^"\\]|\\.)*"$/.test(raw) ? JSON.parse(raw) as string : undefined;
      const decodedValue = decoded(value); const decodedCreatedAt = decoded(createdAt); const decodedActor = actor === undefined ? undefined : decoded(actor);
      if (!kind || !sourceKinds.includes(kind) || !decodedValue || !decodedCreatedAt || (actor !== undefined && decodedActor === undefined)) return fail(line.line, "invalid source block");
      source = decodedActor === undefined ? { kind: kind as SourceRecord["kind"], value: decodedValue, createdAt: decodedCreatedAt } : { kind: kind as SourceRecord["kind"], value: decodedValue, createdAt: decodedCreatedAt, actor: decodedActor };
      continue;
    }
    if (line.text === "time") {
      for (let j = 0; j < children.length; j += 1) {
        const item = children[j]!; const childEnd = children[j + 1]?.line ?? end;
        const nested = lines.filter((candidate) => candidate.line > item.line && candidate.line < childEnd && candidate.indent === 2);
        let expression: TemporalExpression | undefined;
        if (item.text.startsWith("point ")) expression = parsePoint(item.text.slice(6), request.surface);
        else if (item.text.startsWith("window ")) expression = parseWindow(item.text.slice(7), request.surface);
        else if (item.text.startsWith("repeat every ")) expression = parseRepeat(item.text.slice(13), request.surface);
        else if (item.text.startsWith("select ")) expression = selection(item.text.slice(7));
        else if (item.text.startsWith("boundary ")) {
          const boundaryText = request.surface === "authoring" ? item.text.slice(9).replace(/^no later than /, "by ") : item.text.slice(9);
          const boundary = /^(before|by|until) (.+)$/.exec(boundaryText); const within = /^within (.+)$/.exec(boundaryText);
          const value = boundary?.[2] ?? within?.[1]; const parsed = value ? parsePoint(value, request.surface)?.value ?? amount(value) : undefined;
          if (parsed) expression = { kind: "boundary", operator: (boundary?.[1] ?? "within") as BoundaryExpression["operator"], value: parsed };
        } else if (item.text.startsWith("except ")) { const ref = reference(item.text.slice(7)); if (ref) expression = { kind: "exception", predicate: { kind: "event", reference: ref }, effect: "suppress" }; }
        else if (item.text === "relation") { const relation = nested.find((child) => /^(after|before) /.test(child.text)); const offset = nested.find((child) => child.text.startsWith("offset ")); const matched = relation && /^(after|before) (.+)$/.exec(relation.text); const ref = matched && reference(matched[2]); const parsedAmount = offset && amount(offset.text.slice(7)); if (matched && ref) expression = parsedAmount ? { kind: "relation", relation: matched[1] as "after" | "before", anchor: { kind: "event", reference: ref }, offset: { kind: "offset", amount: parsedAmount } } : { kind: "relation", relation: matched[1] as "after" | "before", anchor: { kind: "event", reference: ref } }; }
        else if (item.text === "condition gate" || item.text === "condition trigger") { const when = nested.find((child) => child.text.startsWith("when "))?.text.slice(5); const duration = nested.find((child) => child.text.startsWith("for at-least "))?.text.slice(13); const ref = when && reference(when); const parsedAmount = duration && amount(duration); if (ref) expression = parsedAmount ? { kind: "condition", mode: item.text.endsWith("gate") ? "gate" : "trigger", predicate: { kind: "event", reference: ref }, minimumDuration: { kind: "duration", amount: parsedAmount, role: "condition_minimum" } } : { kind: "condition", mode: item.text.endsWith("gate") ? "gate" : "trigger", predicate: { kind: "event", reference: ref } }; }
        else if (item.text === "adjust") expression = parseAdjustment(item, nested);
        if (!expression) return fail(item.line, `invalid time statement: ${item.text}`);
        expressions.push(expression);
      }
      continue;
    }
    if (line.text.startsWith("reference ")) { const id = identifier(line.text.slice(10)); const kind = children.find((child) => child.text.startsWith("kind "))?.text.slice(5); const source = children.find((child) => child.text.startsWith("source "))?.text.slice(7); if (!id || !kind || !["event", "state", "participant", "context", "custom"].includes(kind)) return fail(line.line, "invalid reference block"); const parsedSource = source === undefined ? undefined : /^"(?:[^"\\]|\\.)*"$/.test(source) ? JSON.parse(source) as string : undefined; if (source !== undefined && parsedSource === undefined) return fail(line.line, "reference source must be a quoted string"); references.push(parsedSource === undefined ? { id, kind: kind as ReferenceRecord["kind"], status: "unresolved" } : { id, kind: kind as ReferenceRecord["kind"], status: "unresolved", source: parsedSource }); continue; }
    if (line.text === "context") { for (const child of children) { const match = /^(timezone|locale|calendar|location|participant|availability|astronomical|custom)(?: ([a-z][a-z0-9-]*))? (@.+)$/.exec(child.text); const ref = match && reference(match[3]); if (!match || !ref) return fail(child.line, "invalid context binding"); context.push(match[2] ? { kind: match[1] as ContextBinding["kind"], name: match[2], reference: ref } : { kind: match[1] as ContextBinding["kind"], reference: ref }); } continue; }
    if (line.text === "lifecycle") { const status = children.find((child) => child.text.startsWith("status "))?.text.slice(7); const effectiveFrom = children.find((child) => child.text.startsWith("effective-from "))?.text.slice(15); const effectiveUntil = children.find((child) => child.text.startsWith("effective-until "))?.text.slice(16); if (!status || !["active", "suspended", "superseded", "retired"].includes(status)) return fail(line.line, "invalid lifecycle status"); const from = effectiveFrom && date(effectiveFrom); const until = effectiveUntil && date(effectiveUntil); if ((effectiveFrom && !from) || (effectiveUntil && !until)) return fail(line.line, "invalid lifecycle date"); lifecycle = { status: status as IntentLifecycle["status"], version: 1, ...(from ? { effectiveFrom: from } : {}), ...(until ? { effectiveUntil: until } : {}) }; continue; }
    return fail(line.line, `unknown top-level statement: ${line.text}`);
  }
  if (expressions.length === 0) return fail(time.line, "time block must contain a statement");
  return { ok: true, value: normalizeDocument({ ...(intentId ? { intentId } : {}), ...(source ? { source } : {}), expression: { kind: "compound", expressions }, references, context, ...(lifecycle ? { lifecycle } : {}) }) };
}
