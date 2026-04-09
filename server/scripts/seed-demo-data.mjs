import { createScriptRepository } from "./script-helpers.mjs";

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

const { repository, targetUserId } = createScriptRepository();

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

console.log(
  JSON.stringify(
    {
      action: "seed-demo-data",
      effectiveUserId: targetUserId || repository.getDiagnostics?.()?.userId || null,
      meals: sampleMeals.length,
      repository: repository.kind,
      exercises: sampleExercises.length,
    },
    null,
    2,
  ),
);

try {
  repository.ensure();
  const db = await repository.getDb();

  if ((db.intakeEntries?.length || 0) > 0 || (db.exerciseEntries?.length || 0) > 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          reason: "entries already exist",
          intakeEntries: db.intakeEntries?.length || 0,
          exerciseEntries: db.exerciseEntries?.length || 0,
        },
        null,
        2,
      ),
    );
    console.log("Seed: skipped because demo data already exists");
    process.exit(0);
  }

  for (const meal of sampleMeals) {
    await repository.createIntake(meal);
  }

  for (const exercise of sampleExercises) {
    await repository.createExercise(exercise);
  }

  const summaryResult = repository.recomputeDailySummaries
    ? await repository.recomputeDailySummaries()
    : null;
  const patternResult = repository.recomputePatternShortcuts
    ? await repository.recomputePatternShortcuts()
    : null;
  const nextDb = await repository.getDb();

  console.log(
    JSON.stringify(
      {
        ok: true,
        exerciseEntries: nextDb.exerciseEntries?.length || 0,
        intakeEntries: nextDb.intakeEntries?.length || 0,
        patternResult,
        summaryResult,
      },
      null,
      2,
    ),
  );
  console.log("Seed: demo data ready");
} catch (error) {
  console.error(`Seed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
