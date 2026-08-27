import type { ContextKind, TemporalExpression } from "../model/types.js";

export type ResolveSupportKind = "exact" | "needs" | "unsupported" | "conflicted";
export type ResolveOutcomeKind = "candidate" | "needs" | "unsupported" | "conflict" | "effect";
export type ResolveSupportReport = Readonly<{
  expressionKind: TemporalExpression["kind"];
  support: ResolveSupportKind;
  outcome: ResolveOutcomeKind;
  needs: ReadonlyArray<string>;
  unsupported: ReadonlyArray<string>;
}>;

const report = (expressionKind: TemporalExpression["kind"], support: ResolveSupportKind, outcome: ResolveOutcomeKind, needs: ReadonlyArray<string> = [], unsupported: ReadonlyArray<string> = []): ResolveSupportReport => ({ expressionKind, support, outcome, needs, unsupported });
const semanticWindowNeed = (name: string): ContextKind => name.includes(":") ? "custom" : "locale";

export function classifyResolveSupport(expression: TemporalExpression): ResolveSupportReport {
  switch (expression.kind) {
    case "point":
      return expression.value.kind === "clock" ? report("point", "needs", "needs", ["timezone"]) : report("point", "exact", "candidate");
    case "window":
      return expression.value.kind === "explicit_window" ? report("window", "needs", "needs", ["timezone"]) : report("window", "needs", "needs", [semanticWindowNeed(expression.value.name)]);
    case "repeat":
      return report("repeat", "needs", "needs", ["lifecycle.effectiveFrom"]);
    case "selection":
      if (expression.selector.kind !== "ordinal" && expression.selector.kind !== "all") return report("selection", "unsupported", "unsupported", [], [`selector.${expression.selector.kind}`]);
      if (expression.filter?.kind === "business_day") return report("selection", "needs", "needs", ["calendar"]);
      if (expression.filter?.kind === "weekday") return report("selection", "exact", "candidate");
      return report("selection", "unsupported", "unsupported", [], ["selection.candidate-provider"]);
    case "relation":
      return report("relation", "needs", "needs", [`reference:${expression.anchor.reference}`]);
    case "offset":
      return expression.amount.mode === "business" ? report("offset", "needs", "needs", ["calendar"]) : report("offset", "unsupported", "unsupported", [], ["offset.without-candidate"]);
    case "duration":
      return report("duration", "unsupported", "unsupported", [], ["duration.as-candidate"]);
    case "condition":
      return report("condition", "needs", "needs", [`reference:${expression.predicate.reference}`]);
    case "boundary":
      return report("boundary", "unsupported", "unsupported", [], ["boundary.as-candidate"]);
    case "exception":
      return report("exception", "needs", "needs", [`reference:${expression.predicate.reference}`]);
    case "adjustment":
      return report("adjustment", "needs", "needs", [`reference:${expression.when.reference}`]);
    case "compound": {
      const reports = expression.expressions.map(classifyResolveSupport);
      const unsupported = reports.flatMap((item) => item.unsupported);
      const needs = [...new Set(reports.flatMap((item) => item.needs))];
      if (unsupported.length > 0) return report("compound", "unsupported", "unsupported", needs, unsupported);
      if (reports.some((item) => item.support === "conflicted")) return report("compound", "conflicted", "conflict", needs, unsupported);
      if (needs.length > 0) return report("compound", "needs", "needs", needs, unsupported);
      return report("compound", "exact", "candidate");
    }
  }
}
