import { createRepository, getServerConfig } from "../lib/repository.mjs";

function buildHints(connection, options = {}) {
  if (!connection || !Array.isArray(connection.checks)) {
    return [];
  }

  const deepMode = options.deepMode ?? false;
  const failedChecks = connection.checks.filter((check) => !check.ok);
  if (failedChecks.length === 0) {
    return [];
  }

  const missingProfile = failedChecks.some(
    (check) => check.name === "profile_row_for_configured_user",
  );
  const missingTables = failedChecks
    .filter(
      (check) =>
        deepMode &&
        [
          "profiles",
          "intake_entries",
          "exercise_entries",
          "daily_summaries",
          "meal_pattern_shortcuts",
          "analytics_events",
          "user_experiment_assignments",
        ].includes(check.name),
    )
    .map((check) => check.name);

  const hints = [];
  if (missingTables.length > 0) {
    hints.push(
      `Apply the Supabase migration before retrying. Missing or inaccessible tables: ${missingTables.join(", ")}.`,
    );
  }
  if (missingProfile) {
    hints.push("Create the configured test profile row with: npm run api:bootstrap:postgres");
  }

  if (hints.length === 0) {
    hints.push("Check Supabase connectivity, env values, and RLS/service-role configuration.");
  }

  return hints;
}

const config = getServerConfig();
const repository = createRepository(config);
const liveMode = process.env.CALORIE_APP_PREFLIGHT_LIVE === "1";
const deepMode = process.env.CALORIE_APP_PREFLIGHT_DEEP === "1";

const diagnostics = repository.getDiagnostics?.() ?? { repository: repository.kind };

console.log(
  JSON.stringify(
    {
      port: config.port,
      repository: repository.kind,
      diagnostics,
      deepMode,
      liveMode,
    },
    null,
    2,
  ),
);

try {
  repository.ensure();
  if (liveMode && repository.probeConnection) {
    const connection = await repository.probeConnection({ deep: deepMode });
    const hints = buildHints(connection, { deepMode });
    console.log(JSON.stringify({ connection, hints }, null, 2));
    if (!connection.ok) {
      process.exitCode = 1;
      console.error("Preflight: live connection probe failed");
      process.exit();
    }
  }
  console.log("Preflight: ready");
} catch (error) {
  console.error(`Preflight: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
