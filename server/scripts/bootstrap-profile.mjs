import { createScriptRepository } from "./script-helpers.mjs";

function readStringEnv(name, fallback) {
  const value = process.env[name];
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function readNumberEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const { repository, targetUserId } = createScriptRepository({
  repository: "postgres",
});

const bootstrapProfile = {
  age: readNumberEnv("CALORIE_APP_BOOTSTRAP_AGE", 28),
  currentWeightKg: readNumberEnv("CALORIE_APP_BOOTSTRAP_CURRENT_WEIGHT_KG", 68),
  goalWeightKg: readNumberEnv("CALORIE_APP_BOOTSTRAP_GOAL_WEIGHT_KG", 62),
  name: readStringEnv("CALORIE_APP_BOOTSTRAP_NAME", "Ava"),
  sex: readStringEnv("CALORIE_APP_BOOTSTRAP_SEX", "female"),
  timezone: readStringEnv("CALORIE_APP_BOOTSTRAP_TIMEZONE", "America/Los_Angeles"),
};

console.log(
  JSON.stringify(
    {
      action: "bootstrap-profile",
      effectiveUserId: targetUserId || repository.getDiagnostics?.()?.userId || null,
      input: bootstrapProfile,
      repository: repository.kind,
    },
    null,
    2,
  ),
);

try {
  repository.ensure();
  const profile = await repository.updateProfile(bootstrapProfile);
  const connection = repository.probeConnection
    ? await repository.probeConnection({ deep: true })
    : null;

  console.log(
    JSON.stringify(
      {
        connection,
        nextStep: "Run npm run api:preflight:postgres:deep",
        ok: true,
        profile,
      },
      null,
      2,
    ),
  );
  console.log("Bootstrap: profile ready");
} catch (error) {
  console.error(`Bootstrap: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
