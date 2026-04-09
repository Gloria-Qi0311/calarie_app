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

function formatDateOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function formatLocalDateOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const bootstrapProfile = {
  age: readNumberEnv("CALORIE_APP_BOOTSTRAP_AGE", 28),
  currentWeightKg: readNumberEnv("CALORIE_APP_BOOTSTRAP_CURRENT_WEIGHT_KG", 68),
  goalWeightKg: readNumberEnv("CALORIE_APP_BOOTSTRAP_GOAL_WEIGHT_KG", 62),
  name: readStringEnv("CALORIE_APP_BOOTSTRAP_NAME", "Ava"),
  sex: readStringEnv("CALORIE_APP_BOOTSTRAP_SEX", "female"),
  timezone: readStringEnv("CALORIE_APP_BOOTSTRAP_TIMEZONE", "America/Los_Angeles"),
};

const sampleMeals = [
  {
    calories: 320,
    localDate: formatLocalDateOffset(2),
    loggedAtUtc: formatDateOffset(2),
    mealType: "breakfast",
    name: "Overnight oats",
    source: "quick-add",
  },
  {
    calories: 480,
    localDate: formatLocalDateOffset(1),
    loggedAtUtc: formatDateOffset(1),
    mealType: "lunch",
    name: "Chicken salad",
    source: "quick-add",
  },
  {
    calories: 460,
    localDate: formatLocalDateOffset(0),
    loggedAtUtc: formatDateOffset(0),
    mealType: "lunch",
    name: "Chicken salad",
    source: "quick-add",
  },
  {
    calories: 260,
    localDate: formatLocalDateOffset(0),
    loggedAtUtc: new Date().toISOString(),
    mealType: "snack",
    name: "Greek yogurt parfait",
    source: "quick-add",
  },
];

const sampleExercises = [
  {
    caloriesBurned: 120,
    localDate: formatLocalDateOffset(1),
    loggedAtUtc: formatDateOffset(1),
    name: "Walk",
    source: "quick-add",
  },
  {
    caloriesBurned: 90,
    localDate: formatLocalDateOffset(0),
    loggedAtUtc: new Date().toISOString(),
    name: "Yoga",
    source: "quick-add",
  },
];

const { repository, targetUserId } = createScriptRepository();

console.log(
  JSON.stringify(
    {
      action: "prepare-demo-user",
      bootstrapProfile,
      effectiveUserId: targetUserId || repository.getDiagnostics?.()?.userId || null,
      repository: repository.kind,
    },
    null,
    2,
  ),
);

try {
  repository.ensure();

  let db = null;
  try {
    db = await Promise.resolve(repository.getDb());
  } catch {
    db = null;
  }
  if (!db?.profile) {
    await repository.updateProfile(bootstrapProfile);
    db = await Promise.resolve(repository.getDb());
  }

  const seedApplied = {
    exercises: 0,
    meals: 0,
  };

  if ((db?.intakeEntries?.length || 0) === 0) {
    for (const meal of sampleMeals) {
      await repository.createIntake(meal);
      seedApplied.meals += 1;
    }
  }

  if ((db?.exerciseEntries?.length || 0) === 0) {
    for (const exercise of sampleExercises) {
      await repository.createExercise(exercise);
      seedApplied.exercises += 1;
    }
  }

  const summaryResult = repository.recomputeDailySummaries
    ? await repository.recomputeDailySummaries()
    : null;
  const patternResult = repository.recomputePatternShortcuts
    ? await repository.recomputePatternShortcuts()
    : null;
  const nextDb = await Promise.resolve(repository.getDb());

  console.log(
    JSON.stringify(
      {
        ok: true,
        exerciseEntries: nextDb.exerciseEntries?.length || 0,
        intakeEntries: nextDb.intakeEntries?.length || 0,
        patternResult,
        repository: repository.kind,
        seedApplied,
        summaryResult,
      },
      null,
      2,
    ),
  );
  console.log("Prepare: demo user ready");
} catch (error) {
  console.error(`Prepare: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
