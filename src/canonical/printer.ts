import type { ClockValue, NormalizedDocument, TemporalAmount, TemporalExpression } from "../model/types.js";

const pad = (value: number) => String(value).padStart(2, "0");
const printClock = (value: ClockValue) => `${pad(value.hour)}:${pad(value.minute)}${value.second === undefined ? "" : `:${pad(value.second)}`}`;
const printAmount = (value: TemporalAmount) => `${value.value} ${value.unit.replace("_", " ")}${value.value === 1 ? "" : "s"}${value.mode === "business" ? "" : ` ${value.mode}`}`;
const printSelection = (expression: Extract<TemporalExpression, { kind: "selection" }>) => {
  if (expression.filter?.kind === "weekday" && expression.selector.kind === "ordinal") { const ordinal: Record<number, string> = { 1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth", [-1]: "last" }; return `${ordinal[expression.selector.value]} ${expression.filter.value[0]!.toUpperCase()}${expression.filter.value.slice(1)}`; }
  if (expression.filter?.kind === "weekday" && expression.selector.kind === "all") return `${expression.filter.value[0]!.toUpperCase()}${expression.filter.value.slice(1)}`;
  if (expression.filter?.kind === "business_day" && expression.selector.kind === "ordinal" && expression.selector.value === -1) return "last business day";
  if (expression.filter?.kind === "business_day" && expression.selector.kind === "next") return "next business day";
  if (expression.filter?.kind === "business_day" && expression.selector.kind === "previous") return "previous business day";
  if (expression.filter?.kind === "available_slot" && expression.selector.kind === "earliest") return "earliest available slot";
  if (expression.filter?.kind === "available_slot" && expression.selector.kind === "latest") return "latest available slot";
  throw new Error("unsupported canonical selection");
};
const rank: Record<TemporalExpression["kind"], number> = { point: 0, repeat: 1, relation: 2, selection: 3, window: 4, boundary: 5, condition: 6, exception: 7, adjustment: 8, offset: 9, duration: 10, compound: 11 };

function printExpression(expression: TemporalExpression): ReadonlyArray<string> {
  switch (expression.kind) {
    case "point": return [`  point ${expression.value.kind === "clock" ? printClock(expression.value) : expression.value.kind === "date" ? `${expression.value.year}-${pad(expression.value.month)}-${pad(expression.value.day)}` : expression.value.name}`];
    case "window": return [`  window ${expression.value.kind === "explicit_window" ? `${printClock(expression.value.start)} to ${printClock(expression.value.end)}` : expression.value.name}`];
    case "repeat": return [`  repeat every ${expression.every === 1 ? "" : `${expression.every} `}${expression.unit}${expression.every === 1 ? "" : "s"}${expression.mode === "elapsed" ? " elapsed" : ""}`];
    case "selection": return [`  select ${printSelection(expression)}`];
    case "relation": return ["  relation", `    ${expression.relation} ${expression.anchor.reference}`, ...(expression.offset ? [`    offset ${printAmount(expression.offset.amount)}`] : [])];
    case "condition": return [`  condition ${expression.mode}`, `    when ${expression.predicate.reference}`, ...(expression.minimumDuration ? [`    for at-least ${printAmount(expression.minimumDuration.amount)}`] : [])];
    case "boundary": return [`  boundary ${expression.operator} ${typeof expression.value === "object" && "kind" in expression.value && expression.value.kind === "clock" ? printClock(expression.value) : typeof expression.value === "object" && "kind" in expression.value && expression.value.kind === "date" ? `${expression.value.year}-${pad(expression.value.month)}-${pad(expression.value.day)}` : typeof expression.value === "object" && "kind" in expression.value && expression.value.kind === "semantic_point" ? expression.value.name : "amount" in (expression.value as object) ? printAmount(expression.value as TemporalAmount) : (expression.value as { reference: string }).reference}`];
    case "exception": return [`  except ${expression.predicate.reference}`];
    case "adjustment": { const operation = expression.operation.kind === "move" ? `move ${expression.operation.direction} to ${printSelection(expression.operation.target as Extract<TemporalExpression, { kind: "selection" }>)}` : expression.operation.kind === "preserve" ? `preserve ${expression.operation.aspect.replaceAll("_", "-")}` : `substitute ${printExpression(expression.operation.target)[0]!.trim()}`; return ["  adjust", `    when ${expression.when.reference}`, ...(expression.precedence ? [`    precedence ${expression.precedence}`] : []), `    ${operation}`]; }
    default: throw new Error(`cannot print ${expression.kind} at document level`);
  }
}

export function printDocument(document: NormalizedDocument): string {
  const lines: string[] = [];
  if (document.intentId) lines.push(`intent ${document.intentId}`);
  if (document.source) { lines.push("source", `  kind ${document.source.kind}`, `  value ${JSON.stringify(document.source.value)}`, `  created-at ${JSON.stringify(document.source.createdAt)}`); if (document.source.actor !== undefined) lines.push(`  actor ${JSON.stringify(document.source.actor)}`); }
  lines.push("time");
  for (const expression of [...document.expression.expressions].sort((a, b) => rank[a.kind] - rank[b.kind])) lines.push(...printExpression(expression));
  for (const ref of document.references) { lines.push(`reference ${ref.id}`, `  kind ${ref.kind}`); if (ref.source !== undefined) lines.push(`  source ${JSON.stringify(ref.source)}`); }
  if (document.context.length) { lines.push("context"); for (const binding of document.context) lines.push(`  ${binding.kind}${binding.name ? ` ${binding.name}` : ""} ${binding.reference}`); }
  if (document.lifecycle) { lines.push("lifecycle", `  status ${document.lifecycle.status}`); if (document.lifecycle.effectiveFrom) lines.push(`  effective-from ${document.lifecycle.effectiveFrom.year}-${pad(document.lifecycle.effectiveFrom.month)}-${pad(document.lifecycle.effectiveFrom.day)}`); if (document.lifecycle.effectiveUntil) lines.push(`  effective-until ${document.lifecycle.effectiveUntil.year}-${pad(document.lifecycle.effectiveUntil.month)}-${pad(document.lifecycle.effectiveUntil.day)}`); }
  return `${lines.join("\n")}\n`;
}
