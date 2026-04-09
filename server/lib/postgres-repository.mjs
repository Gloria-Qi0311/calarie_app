import {
  assignExperiments,
  buildPatternCoverage,
  buildSummaryCoverage,
  deriveMealPatternShortcuts,
  recomputeDailySummaries,
  estimateDailyCalorieTarget,
  formatLocalDate,
  inferGoalDirection,
} from "./domain.mjs";
import { HttpError } from "./http.mjs";

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function buildHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function fetchSupabaseJson(supabaseUrl, serviceRoleKey, path, init = {}) {
  const response = await fetch(`${trimTrailingSlash(supabaseUrl)}/rest/v1${path}`, {
    ...init,
    headers: buildHeaders(serviceRoleKey, init.headers),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function mapProfileRow(row) {
  if (!row) {
    return null;
  }

  return {
    name: row.name ?? "",
    age: row.age ?? 0,
    sex: row.sex ?? "prefer-not",
    currentWeightKg: Number(row.current_weight_kg ?? 0),
    goalWeightKg: Number(row.goal_weight_kg ?? 0),
    goalDirection: row.goal_direction ?? "maintain",
    dailyCalorieTarget: row.daily_calorie_target ?? 2000,
    timezone: row.timezone ?? "UTC",
    createdAtUtc: row.created_at_utc,
    updatedAtUtc: row.updated_at_utc,
  };
}

function mapIntakeRow(row) {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories,
    mealType: row.meal_type,
    source: row.source,
    loggedAtUtc: row.logged_at_utc,
    localDate: row.local_date,
    timezoneAtLog: row.timezone_at_log,
  };
}

function mapExerciseRow(row) {
  return {
    id: row.id,
    name: row.name,
    caloriesBurned: row.calories_burned,
    source: row.source,
    loggedAtUtc: row.logged_at_utc,
    localDate: row.local_date,
    timezoneAtLog: row.timezone_at_log,
  };
}

function mapAnalyticsRow(row) {
  return {
    id: row.id,
    name: row.event_name,
    createdAtUtc: row.created_at_utc,
    payload: row.event_payload ?? undefined,
  };
}

function mapDailySummaryRow(row) {
  return {
    exerciseCount: row.exercise_count,
    localDate: row.local_date,
    mealCount: row.meal_count,
    netCalories: row.net_calories,
    remainingCalories: row.remaining_calories,
    sourceRecomputedAtUtc: row.source_recomputed_at_utc,
    targetCalories: row.target_calories,
    totalExerciseCalories: row.total_exercise_calories,
    totalIntakeCalories: row.total_intake_calories,
  };
}

function mapPatternShortcutRow(row) {
  return {
    averageCalories: row.average_calories,
    count: row.count,
    key: row.pattern_key,
    label: row.label,
    mealType: row.meal_type,
  };
}

function buildExperimentAssignments(rows, userId) {
  if (!rows?.length) {
    return assignExperiments(userId);
  }

  const assignments = {};
  for (const row of rows) {
    assignments[row.experiment_name] = row.variant;
  }

  return {
    ...assignExperiments(userId),
    ...assignments,
  };
}

function buildUndoCandidate(intakeRow, exerciseRow) {
  const intakeDeletedAt = intakeRow?.deleted_at_utc ? new Date(intakeRow.deleted_at_utc).getTime() : 0;
  const exerciseDeletedAt = exerciseRow?.deleted_at_utc
    ? new Date(exerciseRow.deleted_at_utc).getTime()
    : 0;

  if (!intakeRow && !exerciseRow) {
    return null;
  }

  if (intakeDeletedAt >= exerciseDeletedAt) {
    return { kind: "intake", entry: mapIntakeRow(intakeRow) };
  }

  return { kind: "exercise", entry: mapExerciseRow(exerciseRow) };
}

export function createPostgresRepository(options = {}) {
  const allowUserOverride =
    options.allowUserOverride ??
    (process.env.CALORIE_APP_ALLOW_USER_OVERRIDE === undefined
      ? true
      : process.env.CALORIE_APP_ALLOW_USER_OVERRIDE === "1");
  const enableDevBearerAuth =
    options.enableDevBearerAuth ?? process.env.CALORIE_APP_ENABLE_DEV_BEARER_AUTH === "1";
  const connectionString =
    options.connectionString ||
    process.env.CALORIE_APP_DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    null;
  const supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL || null;
  const serviceRoleKey =
    options.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  const userId = options.userId || process.env.CALORIE_APP_USER_ID || process.env.SUPABASE_USER_ID || null;
  const requiredTables = [
    "profiles",
    "intake_entries",
    "exercise_entries",
    "daily_summaries",
    "meal_pattern_shortcuts",
    "analytics_events",
    "user_experiment_assignments",
  ];

  function ensureConnection() {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new HttpError(
        500,
        "Postgres repository requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
  }

  function ensureUserId() {
    if (!userId) {
      throw new HttpError(
        401,
        "Postgres repository requires CALORIE_APP_USER_ID or a request-scoped X-Calorie-App-User-Id.",
      );
    }
  }

  async function selectMany(path) {
    return (await fetchSupabaseJson(supabaseUrl, serviceRoleKey, path)) ?? [];
  }

  async function selectOne(path) {
    const rows = await selectMany(path);
    return rows[0] ?? null;
  }

  async function mutate(path, init) {
    return fetchSupabaseJson(supabaseUrl, serviceRoleKey, path, init);
  }

  async function probePath(path) {
    const response = await fetch(`${trimTrailingSlash(supabaseUrl)}/rest/v1${path}`, {
      method: "GET",
      headers: buildHeaders(serviceRoleKey),
    });

    const text = await response.text();
    return {
      bodyPreview: text.slice(0, 300),
      ok: response.ok,
      status: response.status,
    };
  }

  async function probeTable(tableName) {
    const result = await probePath(`/${tableName}?select=*&limit=1`);
    return {
      name: tableName,
      ok: result.ok,
      preview: result.bodyPreview,
      status: result.status,
    };
  }

  async function getProfileRow() {
    ensureUserId();
    return selectOne(
      `/profiles?select=user_id,name,age,sex,current_weight_kg,goal_weight_kg,goal_direction,daily_calorie_target,timezone,created_at_utc,updated_at_utc&user_id=eq.${userId}&limit=1`,
    );
  }

  async function getDailySummaryRows() {
    ensureUserId();
    return selectMany(
      `/daily_summaries?select=local_date,total_intake_calories,total_exercise_calories,net_calories,target_calories,remaining_calories,meal_count,exercise_count,source_recomputed_at_utc&user_id=eq.${userId}&order=local_date.desc`,
    );
  }

  async function getPatternShortcutRows() {
    ensureUserId();
    return selectMany(
      `/meal_pattern_shortcuts?select=pattern_key,label,meal_type,count,average_calories&user_id=eq.${userId}&order=count.desc,average_calories.asc`,
    );
  }

  async function deleteDailySummaryDates(localDates) {
    ensureUserId();
    if (!localDates.length) {
      return;
    }

    const encodedDates = localDates.join(",");
    await mutate(`/daily_summaries?user_id=eq.${userId}&local_date=in.(${encodedDates})`, {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    });
  }

  async function deletePatternShortcutKeys(patternKeys) {
    ensureUserId();
    for (const patternKey of patternKeys) {
      await mutate(
        `/meal_pattern_shortcuts?user_id=eq.${userId}&pattern_key=eq.${encodeURIComponent(patternKey)}`,
        {
          method: "DELETE",
          headers: {
            Prefer: "return=minimal",
          },
        },
      );
    }
  }

  async function getSummarySnapshot() {
    const [profileRow, intakeRows, exerciseRows, dailySummaryRows, patternShortcutRows] =
      await Promise.all([
      getProfileRow(),
      selectMany(
        `/intake_entries?select=id,name,calories,meal_type,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null&order=logged_at_utc.asc`,
      ),
      selectMany(
        `/exercise_entries?select=id,name,calories_burned,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null&order=logged_at_utc.asc`,
      ),
      getDailySummaryRows(),
      getPatternShortcutRows(),
    ]);

    if (!profileRow) {
      throw new HttpError(
        404,
        `Profile row not found for CALORIE_APP_USER_ID=${userId}. Create a profile first or update the env.`,
      );
    }

    return {
      dailySummaries: dailySummaryRows.map(mapDailySummaryRow),
      exerciseEntries: exerciseRows.map(mapExerciseRow),
      intakeEntries: intakeRows.map(mapIntakeRow),
      patternShortcuts: patternShortcutRows.map(mapPatternShortcutRow),
      profile: mapProfileRow(profileRow),
    };
  }

  async function recomputeAndPersistDailySummaries(options = {}) {
    const profileRow = await getProfileRow();
    if (!profileRow) {
      throw new HttpError(
        404,
        `Profile row not found for CALORIE_APP_USER_ID=${userId}. Create a profile first or update the env.`,
      );
    }

    const [intakeRows, exerciseRows, existingSummaryRows] = await Promise.all([
      selectMany(
        `/intake_entries?select=id,name,calories,meal_type,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null`,
      ),
      selectMany(
        `/exercise_entries?select=id,name,calories_burned,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null`,
      ),
      getDailySummaryRows(),
    ]);

    const includeDates = options.includeDates ?? [];
    const expectedDates = new Set(includeDates);

    for (const row of intakeRows) {
      if (row.local_date) {
        expectedDates.add(row.local_date);
      }
    }

    for (const row of exerciseRows) {
      if (row.local_date) {
        expectedDates.add(row.local_date);
      }
    }

    const extraDates = existingSummaryRows
      .map((row) => row.local_date)
      .filter((localDate) => !expectedDates.has(localDate));

    const summaries = recomputeDailySummaries(
      intakeRows.map(mapIntakeRow),
      exerciseRows.map(mapExerciseRow),
      profileRow.daily_calorie_target ?? 2000,
      { includeDates },
    ).filter((summary) => summary.mealCount > 0 || summary.exerciseCount > 0);

    if (extraDates.length > 0) {
      await deleteDailySummaryDates(extraDates);
    }

    if (summaries.length === 0) {
      return [];
    }

    const payload = summaries.map((summary) => ({
      user_id: userId,
      exercise_count: summary.exerciseCount,
      local_date: summary.localDate,
      meal_count: summary.mealCount,
      net_calories: summary.netCalories,
      remaining_calories: summary.remainingCalories,
      source_recomputed_at_utc: new Date().toISOString(),
      target_calories: summary.targetCalories,
      total_exercise_calories: summary.totalExerciseCalories,
      total_intake_calories: summary.totalIntakeCalories,
    }));

    await mutate("/daily_summaries?on_conflict=user_id,local_date", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
    });

    return summaries;
  }

  async function recomputeAndPersistPatternShortcuts() {
    const intakeRows = await selectMany(
      `/intake_entries?select=id,name,calories,meal_type,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null`,
    );
    const existingRows = await getPatternShortcutRows();
    const shortcuts = deriveMealPatternShortcuts(intakeRows.map(mapIntakeRow), {
      limit: 4,
      minCount: 2,
    });

    const existingKeys = new Set(existingRows.map((row) => row.pattern_key));
    const nextKeys = new Set(shortcuts.map((shortcut) => shortcut.key));
    const extraKeys = Array.from(existingKeys).filter((key) => !nextKeys.has(key));

    if (extraKeys.length > 0) {
      await deletePatternShortcutKeys(extraKeys);
    }

    if (shortcuts.length === 0) {
      return [];
    }

    await mutate("/meal_pattern_shortcuts?on_conflict=user_id,pattern_key", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(
        shortcuts.map((shortcut) => ({
          user_id: userId,
          pattern_key: shortcut.key,
          label: shortcut.label,
          meal_type: shortcut.mealType,
          count: shortcut.count,
          average_calories: shortcut.averageCalories,
          refreshed_at_utc: new Date().toISOString(),
        })),
      ),
    });

    return shortcuts;
  }

  async function ensurePersistedDailySummaries(intakeRows, exerciseRows, existingRows) {
    const expectedDates = new Set();

    for (const row of intakeRows) {
      if (row.local_date) {
        expectedDates.add(row.local_date);
      }
    }

    for (const row of exerciseRows) {
      if (row.local_date) {
        expectedDates.add(row.local_date);
      }
    }

    const existingDates = new Set(existingRows.map((row) => row.local_date));
    const missingDates = Array.from(expectedDates).filter((localDate) => !existingDates.has(localDate));
    const extraDates = existingRows
      .map((row) => row.local_date)
      .filter((localDate) => !expectedDates.has(localDate));

    if (missingDates.length === 0 && extraDates.length === 0) {
      return existingRows;
    }

    if (extraDates.length > 0) {
      await deleteDailySummaryDates(extraDates);
    }
    await recomputeAndPersistDailySummaries({ includeDates: missingDates });
    return getDailySummaryRows();
  }

  async function ensurePersistedPatternShortcuts(intakeEntries, existingShortcuts) {
    const derived = deriveMealPatternShortcuts(intakeEntries.map(mapIntakeRow), {
      limit: 4,
      minCount: 2,
    });
    const existingKeys = new Set(existingShortcuts.map((shortcut) => shortcut.pattern_key));
    const nextKeys = new Set(derived.map((shortcut) => shortcut.key));
    const missingKeys = Array.from(nextKeys).filter((key) => !existingKeys.has(key));
    const extraKeys = Array.from(existingKeys).filter((key) => !nextKeys.has(key));

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      return existingShortcuts;
    }

    await recomputeAndPersistPatternShortcuts();
    return getPatternShortcutRows();
  }

  return {
    kind: "postgres",
    connectionString,
    supabaseUrl,
    userId,
    getDiagnostics() {
      return {
        allowUserOverride,
        enableDevBearerAuth,
        hasDatabaseUrl: Boolean(connectionString),
        hasServiceRoleKey: Boolean(serviceRoleKey),
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasUserId: Boolean(userId),
        ready: Boolean(supabaseUrl && serviceRoleKey && (userId || allowUserOverride || enableDevBearerAuth)),
        repository: "postgres",
        requiresRequestUser: !userId && (allowUserOverride || enableDevBearerAuth),
        requiredTables,
        supportedUserSources: [
          ...(userId ? ["configured-default"] : []),
          ...(allowUserOverride ? ["header-override"] : []),
          ...(enableDevBearerAuth ? ["dev-bearer"] : []),
        ],
        userId,
      };
    },
    async getSummaryDiagnostics() {
      const snapshot = await getSummarySnapshot();
      return {
        ...buildSummaryCoverage(
          snapshot.intakeEntries,
          snapshot.exerciseEntries,
          snapshot.dailySummaries,
          {
            targetCalories: snapshot.profile.dailyCalorieTarget,
          },
        ),
        repository: "postgres",
      };
    },
    async getPatternDiagnostics() {
      const snapshot = await getSummarySnapshot();
      return {
        ...buildPatternCoverage(snapshot.intakeEntries, snapshot.patternShortcuts),
        repository: "postgres",
      };
    },
    async probeConnection(options = {}) {
      try {
        ensureConnection();
        const deep = options.deep ?? false;
        const checks = [];

        const baseResult = await probePath("/profiles?select=user_id&limit=1");
        checks.push({
          name: "profiles_rest_access",
          ok: baseResult.ok,
          preview: baseResult.bodyPreview,
          status: baseResult.status,
        });

        if (deep) {
          const tableChecks = await Promise.all(requiredTables.map((tableName) => probeTable(tableName)));
          checks.push(...tableChecks);

          if (userId) {
            const profileRow = await getProfileRow();
            checks.push({
              name: "profile_row_for_configured_user",
              ok: Boolean(profileRow),
              preview: profileRow ? "found" : `missing for user ${userId}`,
              status: profileRow ? 200 : 404,
            });
          } else {
            checks.push({
              name: "profile_row_for_configured_user",
              ok: true,
              preview: "skipped: no effective user id",
              status: null,
            });
          }
        }

        return {
          checks,
          ok: checks.every((check) => check.ok),
          repository: "postgres",
          responsePreview: baseResult.bodyPreview,
          stage: "supabase-rest",
          status: baseResult.status,
          userId,
        };
      } catch (error) {
        return {
          checks: [],
          error: error instanceof Error ? error.message : "unknown error",
          ok: false,
          repository: "postgres",
          stage: "supabase-rest",
          status: null,
          userId,
        };
      }
    },
    ensure() {
      ensureConnection();
      if (!userId && !allowUserOverride) {
        throw new HttpError(
          500,
          "Postgres repository requires CALORIE_APP_USER_ID when request user override is disabled.",
        );
      }
    },

    async getDb() {
      let [
        profileRow,
        intakeRows,
        exerciseRows,
        dailySummaryRows,
        patternShortcutRows,
        analyticsRows,
        experimentRows,
        deletedIntakeRow,
        deletedExerciseRow,
      ] = await Promise.all([
        getProfileRow(),
        selectMany(
          `/intake_entries?select=id,name,calories,meal_type,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null&order=logged_at_utc.asc`,
        ),
        selectMany(
          `/exercise_entries?select=id,name,calories_burned,source,logged_at_utc,local_date,timezone_at_log&user_id=eq.${userId}&deleted_at_utc=is.null&order=logged_at_utc.asc`,
        ),
        selectMany(
          `/daily_summaries?select=local_date,total_intake_calories,total_exercise_calories,net_calories,target_calories,remaining_calories,meal_count,exercise_count,source_recomputed_at_utc&user_id=eq.${userId}&order=local_date.desc`,
        ),
        getPatternShortcutRows(),
        selectMany(
          `/analytics_events?select=id,event_name,event_payload,created_at_utc&user_id=eq.${userId}&order=created_at_utc.asc`,
        ),
        selectMany(
          `/user_experiment_assignments?select=experiment_name,variant&user_id=eq.${userId}`,
        ),
        selectOne(
          `/intake_entries?select=id,name,calories,meal_type,source,logged_at_utc,local_date,timezone_at_log,deleted_at_utc&user_id=eq.${userId}&deleted_at_utc=not.is.null&order=deleted_at_utc.desc&limit=1`,
        ),
        selectOne(
          `/exercise_entries?select=id,name,calories_burned,source,logged_at_utc,local_date,timezone_at_log,deleted_at_utc&user_id=eq.${userId}&deleted_at_utc=not.is.null&order=deleted_at_utc.desc&limit=1`,
        ),
      ]);

      const profile = mapProfileRow(profileRow);
      if (!profile) {
        throw new HttpError(
          404,
          `Profile row not found for CALORIE_APP_USER_ID=${userId}. Create a profile first or update the env.`,
        );
      }

      dailySummaryRows = await ensurePersistedDailySummaries(
        intakeRows,
        exerciseRows,
        dailySummaryRows,
      );
      patternShortcutRows = await ensurePersistedPatternShortcuts(intakeRows, patternShortcutRows);

      return {
        analyticsEvents: analyticsRows.map(mapAnalyticsRow),
        analyticsId: userId,
        dailySummaries: dailySummaryRows.map(mapDailySummaryRow),
        experiments: buildExperimentAssignments(experimentRows, userId),
        exerciseEntries: exerciseRows.map(mapExerciseRow),
        intakeEntries: intakeRows.map(mapIntakeRow),
        lastDeletedEntry: buildUndoCandidate(deletedIntakeRow, deletedExerciseRow),
        patternShortcuts: patternShortcutRows.map(mapPatternShortcutRow),
        profile,
      };
    },

    async updateProfile(input) {
      ensureUserId();
      const profileRow = {
        user_id: userId,
        name: String(input.name || "").trim(),
        age: Number(input.age || 0),
        sex: input.sex || "prefer-not",
        current_weight_kg: Number(input.currentWeightKg || 0),
        goal_weight_kg: Number(input.goalWeightKg || 0),
        goal_direction: inferGoalDirection(
          Number(input.currentWeightKg || 0),
          Number(input.goalWeightKg || 0),
        ),
        daily_calorie_target: estimateDailyCalorieTarget({
          name: String(input.name || "").trim(),
          age: Number(input.age || 0),
          sex: input.sex || "prefer-not",
          currentWeightKg: Number(input.currentWeightKg || 0),
          goalWeightKg: Number(input.goalWeightKg || 0),
        }),
        timezone: input.timezone || undefined,
        updated_at_utc: new Date().toISOString(),
        setup_completed_at_utc: new Date().toISOString(),
      };

      const rows = await mutate("/profiles?on_conflict=user_id", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([profileRow]),
      });

      await recomputeAndPersistDailySummaries();

      return mapProfileRow(rows?.[0] ?? null);
    },

    async recomputeDailySummaries() {
      const summaries = await recomputeAndPersistDailySummaries();
      const diagnostics = await this.getSummaryDiagnostics();
      return {
        ...diagnostics,
        repository: "postgres",
        summaries: summaries.length,
      };
    },
    async recomputePatternShortcuts() {
      const shortcuts = await recomputeAndPersistPatternShortcuts();
      const diagnostics = await this.getPatternDiagnostics();
      return {
        ...diagnostics,
        repository: "postgres",
        shortcuts: shortcuts.length,
      };
    },

    async createIntake(input) {
      ensureUserId();
      const profileRow = await getProfileRow();
      const loggedAtUtc = input.loggedAtUtc || new Date().toISOString();
      const localDate =
        input.localDate || formatLocalDate(new Date(loggedAtUtc), profileRow?.timezone || "UTC");
      const row = {
        user_id: userId,
        name: String(input.name || "").trim(),
        calories: Number(input.calories || 0),
        meal_type: input.mealType || "snack",
        source: input.source || "custom",
        logged_at_utc: loggedAtUtc,
        local_date: localDate,
        timezone_at_log: input.timezoneAtLog || profileRow?.timezone || "UTC",
      };

      const rows = await mutate("/intake_entries", {
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify([row]),
      });

      await recomputeAndPersistDailySummaries({ includeDates: [row.local_date] });
      await recomputeAndPersistPatternShortcuts();

      return mapIntakeRow(rows?.[0] ?? row);
    },

    async updateIntake(entryId, updates) {
      ensureUserId();
      const patch = {};
      if (updates.name !== undefined) {
        patch.name = String(updates.name).trim();
      }
      if (updates.calories !== undefined) {
        patch.calories = Number(updates.calories);
      }
      if (updates.mealType !== undefined) {
        patch.meal_type = updates.mealType;
      }

      const rows = await mutate(
        `/intake_entries?id=eq.${entryId}&user_id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=representation",
          },
          body: JSON.stringify(patch),
        },
      );

      if (rows?.[0]?.local_date) {
        await recomputeAndPersistDailySummaries({ includeDates: [rows[0].local_date] });
      }
      await recomputeAndPersistPatternShortcuts();

      return rows?.[0] ? mapIntakeRow(rows[0]) : null;
    },

    async deleteIntake(entryId) {
      ensureUserId();
      const rows = await mutate(
        `/intake_entries?id=eq.${entryId}&user_id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            deleted_at_utc: new Date().toISOString(),
          }),
        },
      );

      if (rows?.[0]?.local_date) {
        await recomputeAndPersistDailySummaries({ includeDates: [rows[0].local_date] });
      }
      await recomputeAndPersistPatternShortcuts();

      return rows?.[0] ? mapIntakeRow(rows[0]) : null;
    },

    async createExercise(input) {
      ensureUserId();
      const profileRow = await getProfileRow();
      const loggedAtUtc = input.loggedAtUtc || new Date().toISOString();
      const localDate =
        input.localDate || formatLocalDate(new Date(loggedAtUtc), profileRow?.timezone || "UTC");
      const row = {
        user_id: userId,
        name: String(input.name || "").trim(),
        calories_burned: Number(input.caloriesBurned || 0),
        source: input.source || "custom",
        logged_at_utc: loggedAtUtc,
        local_date: localDate,
        timezone_at_log: input.timezoneAtLog || profileRow?.timezone || "UTC",
      };

      const rows = await mutate("/exercise_entries", {
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
        body: JSON.stringify([row]),
      });

      await recomputeAndPersistDailySummaries({ includeDates: [row.local_date] });

      return mapExerciseRow(rows?.[0] ?? row);
    },

    async updateExercise(entryId, updates) {
      ensureUserId();
      const patch = {};
      if (updates.name !== undefined) {
        patch.name = String(updates.name).trim();
      }
      if (updates.caloriesBurned !== undefined) {
        patch.calories_burned = Number(updates.caloriesBurned);
      }

      const rows = await mutate(
        `/exercise_entries?id=eq.${entryId}&user_id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=representation",
          },
          body: JSON.stringify(patch),
        },
      );

      if (rows?.[0]?.local_date) {
        await recomputeAndPersistDailySummaries({ includeDates: [rows[0].local_date] });
      }

      return rows?.[0] ? mapExerciseRow(rows[0]) : null;
    },

    async deleteExercise(entryId) {
      ensureUserId();
      const rows = await mutate(
        `/exercise_entries?id=eq.${entryId}&user_id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            deleted_at_utc: new Date().toISOString(),
          }),
        },
      );

      if (rows?.[0]?.local_date) {
        await recomputeAndPersistDailySummaries({ includeDates: [rows[0].local_date] });
      }

      return rows?.[0] ? mapExerciseRow(rows[0]) : null;
    },

    async restoreLastDeletedEntry() {
      ensureUserId();
      const db = await this.getDb();
      const lastDeletedEntry = db.lastDeletedEntry;
      if (!lastDeletedEntry) {
        return null;
      }

      if (lastDeletedEntry.kind === "intake") {
        await mutate(
          `/intake_entries?id=eq.${lastDeletedEntry.entry.id}&user_id=eq.${userId}`,
          {
            method: "PATCH",
            headers: {
              Prefer: "return=representation",
            },
            body: JSON.stringify({ deleted_at_utc: null }),
          },
        );
      } else {
        await mutate(
          `/exercise_entries?id=eq.${lastDeletedEntry.entry.id}&user_id=eq.${userId}`,
          {
            method: "PATCH",
            headers: {
              Prefer: "return=representation",
            },
            body: JSON.stringify({ deleted_at_utc: null }),
          },
        );
      }

      await recomputeAndPersistDailySummaries({ includeDates: [lastDeletedEntry.entry.localDate] });
      if (lastDeletedEntry.kind === "intake") {
        await recomputeAndPersistPatternShortcuts();
      }

      return lastDeletedEntry;
    },

    async clearLastDeletedEntry() {
      ensureUserId();
      // Soft-delete rows remain deleted. Clearing undo in Postgres mode is a UI concern for now.
      return null;
    },

    async trackEvent(name, payload) {
      ensureUserId();
      const profileRow = userId ? await getProfileRow().catch(() => null) : null;
      await mutate("/analytics_events", {
        method: "POST",
        headers: {
          Prefer: "return=minimal",
        },
        body: JSON.stringify([
          {
            user_id: userId,
            anonymous_id: userId,
            event_name: name,
            event_payload: payload ?? {},
            local_date: formatLocalDate(new Date(), profileRow?.timezone || "UTC"),
          },
        ]),
      });
    },
  };
}
