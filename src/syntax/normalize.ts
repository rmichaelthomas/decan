import type { NormalizedDocument, TemporalExpression } from "../model/types.js";

const rank: Record<TemporalExpression["kind"], number> = { point: 0, repeat: 1, relation: 2, selection: 3, window: 4, boundary: 5, condition: 6, exception: 7, adjustment: 8, offset: 9, duration: 10, compound: 11 };

export function normalizeDocument(document: NormalizedDocument): NormalizedDocument {
  return {
    ...document,
    expression: { kind: "compound", expressions: [...document.expression.expressions].sort((left, right) => rank[left.kind] - rank[right.kind]) },
    references: [...document.references].sort((left, right) => left.id.localeCompare(right.id)),
    context: [...document.context].sort((left, right) => `${left.kind}:${left.name ?? ""}:${left.reference}`.localeCompare(`${right.kind}:${right.name ?? ""}:${right.reference}`))
  };
}
