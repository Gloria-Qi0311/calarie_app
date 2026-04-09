import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assignExperiments,
  buildPatternCoverage,
  buildSummaryCoverage,
  createAnalyticsEvent,
  deriveMealPatternShortcuts,
  estimateDailyCalorieTarget,
  inferGoalDirection,
  formatLocalDate,
  recomputeDailySummaries,
} from "./domain.mjs";

function refreshDerivedState(db, options = {}) {
  db.dailySummaries = recomputeDailySummaries(
    db.intakeEntries,
    db.exerciseEntries,
    db.profile.dailyCalorieTarget,
    {
      includeDates: options.includeDates ?? [],
    },
  ).filter((summary) => summary.mealCount > 0 || summary.exerciseCount > 0);
  db.patternShortcuts = deriveMealPatternShortcuts(db.intakeEntries, {
    limit: 4,
    minCount: 2,
  });
}

function createSeedDatabase() {
  const now = new Date();
  const analyticsId = `remote-${Date.now().toString(36)}`;
  const timezone = "America/Los_Angeles";
  const profile = {
    name: "Ava",
    age: 28,
    sex: "female",
    currentWeightKg: 68,
    goalWeightKg: 62,
    goalDirection: "lose",
    dailyCalorieTarget: estimateDailyCalorieTarget({
      name: "Ava",
      age: 28,
      sex: "female",
      currentWeightKg: 68,
      goalWeightKg: 62,
    }),
    timezone,
    createdAtUtc: now.toISOString(),
    updatedAtUtc: now.toISOString(),
  };

  const today = formatLocalDate(now, timezone);
  const yesterday = formatLocalDate(new Date(now.getTime() - 24 * 60 * 60 * 1000), timezone);
  const twoDaysAgo = formatLocalDate(
    new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    timezone,
  );

  const seedDb = {
    analyticsEvents: [],
    analyticsId,
    dailySummaries: [],
    experiments: assignExperiments(analyticsId),
    exerciseEntries: [
      {
        id: "exercise-1",
        name: "Walk",
        caloriesBurned: 140,
        source: "quick-add",
        loggedAtUtc: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        localDate: today,
        timezoneAtLog: timezone,
      },
      {
        id: "exercise-2",
        name: "Yoga",
        caloriesBurned: 90,
        source: "quick-add",
        loggedAtUtc: new Date(now.getTime() - 27 * 60 * 60 * 1000).toISOString(),
        localDate: yesterday,
        timezoneAtLog: timezone,
      },
    ],
    intakeEntries: [
      {
        id: "meal-1",
        name: "Greek yogurt parfait",
        calories: 250,
        mealType: "breakfast",
        source: "quick-add",
        loggedAtUtc: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        localDate: today,
        timezoneAtLog: timezone,
      },
      {
        id: "meal-2",
        name: "Chicken salad",
        calories: 450,
        mealType: "lunch",
        source: "quick-add",
        loggedAtUtc: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        localDate: today,
        timezoneAtLog: timezone,
      },
      {
        id: "meal-3",
        name: "Chicken salad",
        calories: 470,
        mealType: "lunch",
        source: "quick-add",
        loggedAtUtc: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
        localDate: yesterday,
        timezoneAtLog: timezone,
      },
      {
        id: "meal-4",
        name: "Oatmeal with berries",
        calories: 300,
        mealType: "breakfast",
        source: "quick-add",
        loggedAtUtc: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(),
        localDate: twoDaysAgo,
        timezoneAtLog: timezone,
      },
    ],
    lastDeletedEntry: null,
    patternShortcuts: [],
    profile,
  };

  refreshDerivedState(seedDb);
  return seedDb;
}

export function createMockRepository(options = {}) {
  const allowUserOverride =
    options.allowUserOverride ??
    (process.env.CALORIE_APP_ALLOW_USER_OVERRIDE === undefined
      ? true
      : process.env.CALORIE_APP_ALLOW_USER_OVERRIDE === "1");
  const enableDevBearerAuth =
    options.enableDevBearerAuth ?? process.env.CALORIE_APP_ENABLE_DEV_BEARER_AUTH === "1";
  const userId = options.userId || process.env.CALORIE_APP_USER_ID || "mock-user";
  const configuredDataFile =
    options.dataFile || process.env.CALORIE_APP_DATA_FILE || path.join(os.tmpdir(), "calarie-app-server");
  const dataFile = configuredDataFile.endsWith(".json")
    ? configuredDataFile
    : path.join(configuredDataFile, `${userId}.json`);

  function ensureDatabase() {
    const directory = path.dirname(dataFile);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    if (!existsSync(dataFile)) {
      writeFileSync(dataFile, JSON.stringify(createSeedDatabase(), null, 2));
    }
  }

  function readDb() {
    ensureDatabase();
    return JSON.parse(readFileSync(dataFile, "utf8"));
  }

  function writeDb(db) {
    ensureDatabase();
    writeFileSync(dataFile, JSON.stringify(db, null, 2));
  }

  function mutate(transform) {
    const db = readDb();
    const result = transform(db);
    writeDb(db);
    return result;
  }

  return {
    kind: "mock",
    dataFile,
    getDiagnostics() {
      return {
        allowUserOverride,
        dataFile,
        enableDevBearerAuth,
        ready: true,
        repository: "mock",
        userId,
      };
    },
    async probeConnection() {
      return {
        checks: [
          {
            name: "local_data_file",
            ok: true,
            stage: "local-file",
          },
        ],
        ok: true,
        repository: "mock",
        stage: "local-file",
        userId,
      };
    },
    ensure() {
      ensureDatabase();
    },
    getDb() {
      return readDb();
    },
    getSummaryDiagnostics() {
      const db = readDb();
      return {
        ...buildSummaryCoverage(db.intakeEntries, db.exerciseEntries, db.dailySummaries, {
          targetCalories: db.profile.dailyCalorieTarget,
        }),
        repository: "mock",
      };
    },
    getPatternDiagnostics() {
      const db = readDb();
      return {
        ...buildPatternCoverage(db.intakeEntries, db.patternShortcuts),
        repository: "mock",
      };
    },
    recomputeDailySummaries() {
      return mutate((db) => {
        refreshDerivedState(db);
        return {
          ...buildSummaryCoverage(db.intakeEntries, db.exerciseEntries, db.dailySummaries, {
            targetCalories: db.profile.dailyCalorieTarget,
          }),
          repository: "mock",
          summaries: db.dailySummaries.length,
        };
      });
    },
    recomputePatternShortcuts() {
      return mutate((db) => {
        refreshDerivedState(db);
        return {
          ...buildPatternCoverage(db.intakeEntries, db.patternShortcuts),
          repository: "mock",
          shortcuts: db.patternShortcuts.length,
        };
      });
    },
    updateProfile(input) {
      return mutate((db) => {
        db.profile = {
          ...db.profile,
          name: String(input.name || db.profile.name).trim(),
          age: Number(input.age || db.profile.age),
          sex: input.sex || db.profile.sex,
          currentWeightKg: Number(input.currentWeightKg || db.profile.currentWeightKg),
          goalWeightKg: Number(input.goalWeightKg || db.profile.goalWeightKg),
          timezone: input.timezone || db.profile.timezone,
        };
        db.profile.goalDirection = inferGoalDirection(
          db.profile.currentWeightKg,
          db.profile.goalWeightKg,
        );
        db.profile.dailyCalorieTarget = estimateDailyCalorieTarget(db.profile);
        db.profile.updatedAtUtc = new Date().toISOString();
        refreshDerivedState(db);
        db.analyticsEvents.push(
          createAnalyticsEvent("settings_saved", {
            dailyCalorieTarget: db.profile.dailyCalorieTarget,
            goalDirection: db.profile.goalDirection,
          }),
        );
        return db.profile;
      });
    },
    createIntake(input) {
      return mutate((db) => {
        const loggedAtUtc = input.loggedAtUtc || new Date().toISOString();
        const localDate =
          input.localDate || formatLocalDate(new Date(loggedAtUtc), db.profile.timezone);
        const entry = {
          id: `meal-${Date.now()}`,
          name: String(input.name || "").trim(),
          calories: Number(input.calories || 0),
          mealType: input.mealType || "snack",
          source: input.source || "custom",
          loggedAtUtc,
          localDate,
          timezoneAtLog: input.timezoneAtLog || db.profile.timezone,
        };
        db.intakeEntries.push(entry);
        refreshDerivedState(db, { includeDates: [entry.localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("food_saved", {
            calories: entry.calories,
            mealType: entry.mealType,
            source: entry.source,
          }),
        );
        return entry;
      });
    },
    updateIntake(entryId, updates) {
      return mutate((db) => {
        const index = db.intakeEntries.findIndex((entry) => entry.id === entryId);
        if (index === -1) {
          return null;
        }
        db.intakeEntries[index] = {
          ...db.intakeEntries[index],
          ...updates,
          name: updates.name ? String(updates.name).trim() : db.intakeEntries[index].name,
        };
        refreshDerivedState(db, { includeDates: [db.intakeEntries[index].localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("entry_edited", { entryType: "intake", entryId }),
        );
        return db.intakeEntries[index];
      });
    },
    deleteIntake(entryId) {
      return mutate((db) => {
        const index = db.intakeEntries.findIndex((entry) => entry.id === entryId);
        if (index === -1) {
          return null;
        }
        const [deletedEntry] = db.intakeEntries.splice(index, 1);
        db.lastDeletedEntry = { kind: "intake", entry: deletedEntry };
        refreshDerivedState(db, { includeDates: [deletedEntry.localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("entry_deleted", { entryType: "intake", entryId }),
        );
        return deletedEntry;
      });
    },
    createExercise(input) {
      return mutate((db) => {
        const loggedAtUtc = input.loggedAtUtc || new Date().toISOString();
        const localDate =
          input.localDate || formatLocalDate(new Date(loggedAtUtc), db.profile.timezone);
        const entry = {
          id: `exercise-${Date.now()}`,
          name: String(input.name || "").trim(),
          caloriesBurned: Number(input.caloriesBurned || 0),
          source: input.source || "custom",
          loggedAtUtc,
          localDate,
          timezoneAtLog: input.timezoneAtLog || db.profile.timezone,
        };
        db.exerciseEntries.push(entry);
        refreshDerivedState(db, { includeDates: [entry.localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("exercise_saved", {
            caloriesBurned: entry.caloriesBurned,
            source: entry.source,
          }),
        );
        return entry;
      });
    },
    updateExercise(entryId, updates) {
      return mutate((db) => {
        const index = db.exerciseEntries.findIndex((entry) => entry.id === entryId);
        if (index === -1) {
          return null;
        }
        db.exerciseEntries[index] = {
          ...db.exerciseEntries[index],
          ...updates,
          name: updates.name ? String(updates.name).trim() : db.exerciseEntries[index].name,
        };
        refreshDerivedState(db, { includeDates: [db.exerciseEntries[index].localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("entry_edited", { entryType: "exercise", entryId }),
        );
        return db.exerciseEntries[index];
      });
    },
    deleteExercise(entryId) {
      return mutate((db) => {
        const index = db.exerciseEntries.findIndex((entry) => entry.id === entryId);
        if (index === -1) {
          return null;
        }
        const [deletedEntry] = db.exerciseEntries.splice(index, 1);
        db.lastDeletedEntry = { kind: "exercise", entry: deletedEntry };
        refreshDerivedState(db, { includeDates: [deletedEntry.localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("entry_deleted", { entryType: "exercise", entryId }),
        );
        return deletedEntry;
      });
    },
    restoreLastDeletedEntry() {
      return mutate((db) => {
        const restored = db.lastDeletedEntry;
        if (!restored) {
          return null;
        }

        if (restored.kind === "intake") {
          db.intakeEntries.push(restored.entry);
          db.intakeEntries.sort((left, right) => left.loggedAtUtc.localeCompare(right.loggedAtUtc));
        } else {
          db.exerciseEntries.push(restored.entry);
          db.exerciseEntries.sort((left, right) =>
            left.loggedAtUtc.localeCompare(right.loggedAtUtc),
          );
        }

        refreshDerivedState(db, { includeDates: [restored.entry.localDate] });
        db.analyticsEvents.push(
          createAnalyticsEvent("entry_restored", {
            entryType: restored.kind,
            entryId: restored.entry.id,
          }),
        );
        db.lastDeletedEntry = null;
        return restored;
      });
    },
    clearLastDeletedEntry() {
      mutate((db) => {
        db.lastDeletedEntry = null;
        return null;
      });
    },
    trackEvent(name, payload) {
      mutate((db) => {
        db.analyticsEvents.push(
          createAnalyticsEvent(name, {
            ...(payload ?? {}),
            localDate: formatLocalDate(new Date(), db.profile.timezone),
          }),
        );
        return null;
      });
    },
  };
}
