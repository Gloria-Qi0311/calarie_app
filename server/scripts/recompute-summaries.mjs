import { createScriptRepository } from "./script-helpers.mjs";

const { repository, targetUserId } = createScriptRepository();

console.log(
  JSON.stringify(
    {
      action: "recompute-daily-summaries",
      effectiveUserId: targetUserId || repository.getDiagnostics?.()?.userId || null,
      repository: repository.kind,
    },
    null,
    2,
  ),
);

try {
  repository.ensure();
  if (!repository.recomputeDailySummaries) {
    throw new Error(`Repository ${repository.kind} does not support daily summary recompute.`);
  }

  const result = await repository.recomputeDailySummaries();
  console.log(JSON.stringify({ ok: true, result }, null, 2));
  console.log("Recompute: daily summaries ready");
} catch (error) {
  console.error(`Recompute: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
