import { createScriptRepository } from "./script-helpers.mjs";

const { repository, targetUserId } = createScriptRepository();

console.log(
  JSON.stringify(
    {
      action: "recompute-pattern-shortcuts",
      effectiveUserId: targetUserId || repository.getDiagnostics?.()?.userId || null,
      repository: repository.kind,
    },
    null,
    2,
  ),
);

try {
  repository.ensure();
  if (!repository.recomputePatternShortcuts) {
    throw new Error(`Repository ${repository.kind} does not support pattern shortcut recompute.`);
  }

  const result = await repository.recomputePatternShortcuts();
  console.log(JSON.stringify({ ok: true, result }, null, 2));
  console.log("Recompute: pattern shortcuts ready");
} catch (error) {
  console.error(`Recompute: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
