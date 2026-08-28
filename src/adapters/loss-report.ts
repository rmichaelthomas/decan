export type TemporalLossReport = Readonly<{
  target: "cron" | "rrule";
  targetVersion: "v0.1-exact-weekly-subset";
  operation: "import" | "export";
  fidelity: "exact" | "lossy" | "unsupported";
  preserved: ReadonlyArray<string>;
  discarded: ReadonlyArray<string>;
  assumptions: ReadonlyArray<string>;
  consequences: ReadonlyArray<string>;
  remediation?: string;
}>;

export const exactLossReport = (target: TemporalLossReport["target"], operation: TemporalLossReport["operation"], preserved: ReadonlyArray<string>): TemporalLossReport => ({
  target, targetVersion: "v0.1-exact-weekly-subset", operation, fidelity: "exact", preserved, discarded: [], assumptions: [], consequences: []
});

export const unsupportedLossReport = (target: TemporalLossReport["target"], operation: TemporalLossReport["operation"], consequence: string): TemporalLossReport => ({
  target, targetVersion: "v0.1-exact-weekly-subset", operation, fidelity: "unsupported", preserved: [], discarded: ["source semantics were not converted"], assumptions: [], consequences: [consequence], remediation: "Select an exact supported subset or keep the canonical Decan source."
});
