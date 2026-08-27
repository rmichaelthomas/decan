import type {
  Anchor,
  NormalizedDocument,
  ReferenceId,
  TemporalAmount,
  TemporalError,
  TemporalExpression,
  ValidateResult
} from "../model/types.js";

const validationError = (code: string, message: string, path: string): TemporalError => ({
  category: "validation",
  code,
  message,
  path,
  remediation: "correct_source"
});

const hasValidMode = (amount: TemporalAmount): boolean => (
  (amount.mode === "elapsed" && ["second", "minute", "hour", "day", "week"].includes(amount.unit)) ||
  (amount.mode === "calendar" && ["day", "week", "month", "quarter", "year"].includes(amount.unit)) ||
  (amount.mode === "business" && ["business_day", "business_hour"].includes(amount.unit))
);

const isAnchor = (value: unknown): value is Anchor => (
  typeof value === "object" && value !== null && "reference" in value && "kind" in value
);

type Adjustment = Readonly<{ reference: ReferenceId; precedence: number | undefined; path: string }>;

export function validateDocument(document: NormalizedDocument): ValidateResult {
  const errors: TemporalError[] = [];
  const referenced: Array<Readonly<{ reference: ReferenceId; path: string }>> = [];
  const adjustments: Adjustment[] = [];
  let recurrenceFound = false;

  const validateAmount = (amount: TemporalAmount, path: string): void => {
    if (amount.value <= 0) {
      errors.push(validationError(
        "DECAN-VALIDATION-DURATION-POSITIVE",
        "Duration values must be positive.",
        `${path}.value`
      ));
    }

    if (!hasValidMode(amount)) {
      errors.push(validationError(
        "DECAN-VALIDATION-DURATION-MODE",
        "Duration units must match their declared mode.",
        path
      ));
    }
  };
  const addReference = (anchor: Anchor, path: string): void => {
    referenced.push({ reference: anchor.reference, path });
  };
  const visit = (expression: TemporalExpression, path: string): void => {
    switch (expression.kind) {
      case "compound":
        expression.expressions.forEach((child, index) => visit(child, `${path}.expressions[${index}]`));
        break;
      case "repeat":
        recurrenceFound = true;
        if (expression.every < 1) {
          errors.push(validationError(
            "DECAN-VALIDATION-REPEAT-POSITIVE",
            "Recurrence intervals must be positive.",
            `${path}.every`
          ));
        }
        break;
      case "offset":
        validateAmount(expression.amount, `${path}.amount`);
        break;
      case "duration":
        validateAmount(expression.amount, `${path}.amount`);
        if (!expression.role) {
          errors.push(validationError(
            "DECAN-VALIDATION-DURATION-ROLE",
            "Duration expressions must declare their semantic role.",
            `${path}.role`
          ));
        }
        break;
      case "relation":
        addReference(expression.anchor, `${path}.anchor.reference`);
        if (expression.offset) visit(expression.offset, `${path}.offset`);
        break;
      case "selection":
        if (expression.filter?.kind === "custom") {
          referenced.push({ reference: expression.filter.reference, path: `${path}.filter.reference` });
        }
        break;
      case "condition":
        addReference(expression.predicate, `${path}.predicate.reference`);
        if (expression.minimumDuration) visit(expression.minimumDuration, `${path}.minimumDuration`);
        break;
      case "exception":
        addReference(expression.predicate, `${path}.predicate.reference`);
        break;
      case "adjustment":
        addReference(expression.when, `${path}.when.reference`);
        adjustments.push({ reference: expression.when.reference, precedence: expression.precedence, path });
        if (expression.operation.kind !== "preserve") visit(expression.operation.target, `${path}.operation.target`);
        break;
      case "boundary":
        if (isAnchor(expression.value)) addReference(expression.value, `${path}.value.reference`);
        if (typeof expression.value === "object" && expression.value !== null && "mode" in expression.value) {
          validateAmount(expression.value as TemporalAmount, `${path}.value`);
        }
        break;
      default:
        break;
    }
  };

  visit(document.expression, "expression");

  if (recurrenceFound && !document.lifecycle?.effectiveFrom) {
    errors.push(validationError(
      "DECAN-VALIDATION-RECURRENCE-ORIGIN",
      "Recurrence requires lifecycle.effectiveFrom.",
      "lifecycle.effectiveFrom"
    ));
  }

  const declaredReferences = new Map(document.references.map((reference) => [`@${reference.id}`, reference]));
  for (const reference of referenced) {
    if (!declaredReferences.has(reference.reference)) {
      errors.push(validationError(
        "DECAN-VALIDATION-REFERENCE-DECLARED",
        "Referenced anchors must be declared in document.references.",
        reference.path
      ));
    }
  }

  for (let index = 1; index < adjustments.length; index += 1) {
    const adjustment = adjustments[index];
    const earlier = adjustments.slice(0, index).find((candidate) => (
      candidate.reference === adjustment.reference &&
      (candidate.precedence === undefined || adjustment.precedence === undefined || candidate.precedence === adjustment.precedence)
    ));
    if (earlier) {
      errors.push(validationError(
        "DECAN-VALIDATION-ADJUSTMENT-CONFLICT",
        "Competing adjustments require distinct explicit precedence.",
        `${adjustment.path}.precedence`
      ));
    }
  }

  const unresolvedDependencies = Array.from(new Set(referenced.map(({ reference }) => reference)))
    .filter((reference) => declaredReferences.get(reference)?.status === "unresolved")
    .map((id) => ({ kind: "reference", id }));

  return {
    ok: true,
    value: {
      status: errors.length === 0 ? "valid" : "invalid",
      errors,
      unresolvedDependencies
    }
  };
}
