function stableHash(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function inferGoalDirection(currentWeightKg, goalWeightKg) {
  if (!Number.isFinite(currentWeightKg) || !Number.isFinite(goalWeightKg)) {
    return "maintain";
  }

  if (goalWeightKg < currentWeightKg) return "lose";
  if (goalWeightKg > currentWeightKg) return "gain";
  return "maintain";
}

export function estimateDailyCalorieTarget(input) {
  let base = input.sex === "female" ? 1900 : input.sex === "male" ? 2300 : 2100;

  if (input.age >= 45) {
    base -= 100;
  }

  const goalDirection = inferGoalDirection(input.currentWeightKg, input.goalWeightKg);
  if (goalDirection === "lose") {
    base -= 250;
  }
  if (goalDirection === "gain") {
    base += 200;
  }

  const clamped = Math.min(3200, Math.max(1400, base));
  return Math.round(clamped / 50) * 50;
}

export function assignExperiments(analyticsId) {
  const pick = (name, variants) => variants[stableHash(`${name}:${analyticsId}`) % variants.length];
  return {
    welcome_mood_copy: pick("welcome_mood_copy", ["buddy", "gentle"]),
    today_primary_cta: pick("today_primary_cta", ["log_first", "recommendations_first"]),
    recommendation_framing: pick("recommendation_framing", ["balanced", "encouraging"]),
  };
}

export function formatLocalDate(date, timezone) {
  if (timezone) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftLocalDate(localDate, offsetDays) {
  const [year, month, day] = localDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays));
  const shiftedYear = shifted.getUTCFullYear();
  const shiftedMonth = `${shifted.getUTCMonth() + 1}`.padStart(2, "0");
  const shiftedDay = `${shifted.getUTCDate()}`.padStart(2, "0");
  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}

export function calculateDailySummary(localDate, intakeEntries, exerciseEntries, targetCalories) {
  const totalIntakeCalories = intakeEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalExerciseCalories = exerciseEntries.reduce(
    (sum, entry) => sum + entry.caloriesBurned,
    0,
  );
  const netCalories = totalIntakeCalories - totalExerciseCalories;

  return {
    localDate,
    totalIntakeCalories,
    totalExerciseCalories,
    netCalories,
    targetCalories,
    remainingCalories: targetCalories - netCalories,
    mealCount: intakeEntries.length,
    exerciseCount: exerciseEntries.length,
  };
}

export function recomputeDailySummaries(
  intakeEntries,
  exerciseEntries,
  targetCalories,
  options = {},
) {
  const includeDates = options.includeDates ?? [];
  const localDates = new Set(includeDates);

  for (const entry of intakeEntries) {
    if (entry.localDate) {
      localDates.add(entry.localDate);
    }
  }

  for (const entry of exerciseEntries) {
    if (entry.localDate) {
      localDates.add(entry.localDate);
    }
  }

  return Array.from(localDates)
    .sort((left, right) => right.localeCompare(left))
    .map((localDate) =>
      calculateDailySummary(
        localDate,
        intakeEntries.filter((entry) => entry.localDate === localDate),
        exerciseEntries.filter((entry) => entry.localDate === localDate),
        targetCalories,
      ),
    );
}

export function buildSummaryCoverage(
  intakeEntries,
  exerciseEntries,
  dailySummaries,
  options = {},
) {
  const entryDates = new Set();
  const summaryDates = new Set((dailySummaries || []).map((summary) => summary.localDate));
  const targetCalories = options.targetCalories ?? null;

  for (const entry of intakeEntries) {
    if (entry.localDate) {
      entryDates.add(entry.localDate);
    }
  }

  for (const entry of exerciseEntries) {
    if (entry.localDate) {
      entryDates.add(entry.localDate);
    }
  }

  const missingDates = Array.from(entryDates)
    .filter((localDate) => !summaryDates.has(localDate))
    .sort();
  const extraDates = Array.from(summaryDates)
    .filter((localDate) => !entryDates.has(localDate))
    .sort();
  const staleTargetDates = (dailySummaries || [])
    .filter(
      (summary) =>
        Number.isFinite(targetCalories) &&
        Number.isFinite(summary.targetCalories) &&
        summary.targetCalories !== targetCalories,
    )
    .map((summary) => summary.localDate)
    .sort();

  return {
    entryDateCount: entryDates.size,
    extraDates,
    missingDates,
    staleTargetDates,
    summaryRowCount: summaryDates.size,
    targetCalories,
  };
}

export function buildPatternCoverage(intakeEntries, patternShortcuts) {
  const derived = deriveMealPatternShortcuts(intakeEntries, {
    limit: 4,
    minCount: 2,
  });
  const existingKeys = new Set((patternShortcuts || []).map((shortcut) => shortcut.key));
  const derivedKeys = new Set(derived.map((shortcut) => shortcut.key));

  const missingKeys = Array.from(derivedKeys)
    .filter((key) => !existingKeys.has(key))
    .sort();
  const extraKeys = Array.from(existingKeys)
    .filter((key) => !derivedKeys.has(key))
    .sort();
  const staleKeys = (patternShortcuts || [])
    .filter((shortcut) => {
      const match = derived.find((candidate) => candidate.key === shortcut.key);
      if (!match) {
        return false;
      }

      return (
        shortcut.count !== match.count ||
        shortcut.averageCalories !== match.averageCalories ||
        shortcut.label !== match.label ||
        shortcut.mealType !== match.mealType
      );
    })
    .map((shortcut) => shortcut.key)
    .sort();

  return {
    derivedShortcutCount: derived.length,
    extraKeys,
    missingKeys,
    shortcutRowCount: (patternShortcuts || []).length,
    staleKeys,
  };
}

export function getDailySummaryForDate(db, localDate) {
  const cached = (db.dailySummaries || []).find((summary) => summary.localDate === localDate);
  if (cached) {
    return cached;
  }

  return calculateDailySummary(
    localDate,
    db.intakeEntries.filter((entry) => entry.localDate === localDate),
    db.exerciseEntries.filter((entry) => entry.localDate === localDate),
    db.profile.dailyCalorieTarget,
  );
}

export function deriveMealPatternShortcuts(entries, { minCount = 2, limit = 4 } = {}) {
  const aggregates = new Map();

  for (const entry of entries) {
    const normalizedName = entry.name.trim().toLowerCase().replace(/\s+/g, " ");
    const key = `${entry.mealType}:${normalizedName}`;
    const existing = aggregates.get(key);

    if (existing) {
      existing.count += 1;
      existing.totalCalories += entry.calories;
      continue;
    }

    aggregates.set(key, {
      count: 1,
      totalCalories: entry.calories,
      mealType: entry.mealType,
      normalizedName,
    });
  }

  return Array.from(aggregates.entries())
    .map(([key, aggregate]) => ({
      key,
      label: aggregate.normalizedName.replace(/\b\w/g, (character) => character.toUpperCase()),
      mealType: aggregate.mealType,
      averageCalories: Math.round(aggregate.totalCalories / aggregate.count),
      count: aggregate.count,
    }))
    .filter((pattern) => pattern.count >= minCount)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.averageCalories - right.averageCalories;
    })
    .slice(0, limit);
}

export function getMealSuggestions({ remainingCalories, goalDirection }) {
  const pool = [
    ["Garden salad with vinaigrette", 180, "Fresh greens with light dressing", "🥗", "light"],
    ["Vegetable soup", 200, "Warm and filling", "🍲", "light"],
    ["Greek yogurt with honey", 220, "Protein-rich and sweet", "🥄", "light"],
    ["Turkey wrap", 350, "Lean protein with veggies", "🌯", "light"],
    ["Fruit and cheese plate", 280, "Balanced snack", "🧀", "light"],
    ["Grilled chicken Caesar salad", 480, "Classic and satisfying", "🥗", "medium"],
    ["Quinoa bowl with roasted vegetables", 520, "Wholesome and colorful", "🥙", "medium"],
    ["Salmon poke bowl", 580, "Fresh and nutrient-dense", "🐟", "medium"],
    ["Veggie burger with sweet potato fries", 620, "Plant-based comfort food", "🍔", "medium"],
    ["Chicken teriyaki with brown rice", 550, "Sweet and savory", "🍱", "medium"],
    ["Grilled steak with roasted potatoes", 750, "Hearty and protein-rich", "🥩", "full"],
    ["Pasta with marinara and meatballs", 820, "Italian comfort classic", "🍝", "full"],
    ["Burrito bowl with guacamole", 780, "Loaded with flavor", "🌯", "full"],
    ["Thai curry with jasmine rice", 710, "Aromatic and filling", "🍛", "full"],
    ["Grilled chicken plate with sides", 690, "Complete balanced meal", "🍽️", "full"],
  ].map(([name, calories, description, emoji, type]) => ({
    name,
    calories,
    description,
    emoji,
    type,
  }));

  if (remainingCalories <= 0) {
    return [
      {
        name: "Herbal tea",
        calories: 0,
        description: "Zero calories, very soothing",
        emoji: "🍵",
        type: "drink",
      },
      {
        name: "Sparkling water with lemon",
        calories: 5,
        description: "Refreshing and light",
        emoji: "🥤",
        type: "drink",
      },
    ];
  }

  const margin = goalDirection === "lose" ? 30 : goalDirection === "gain" ? 100 : 50;
  let filtered = pool.filter((suggestion) => suggestion.calories <= remainingCalories + margin);

  if (filtered.length > 6) {
    if (remainingCalories < 400) {
      filtered = filtered.filter((suggestion) => suggestion.type === "light");
    } else if (remainingCalories < 700) {
      filtered = filtered.filter(
        (suggestion) => suggestion.type === "light" || suggestion.type === "medium",
      );
    }
  }

  return filtered.slice(0, 6);
}

export function deriveCompanionProgressState({ loggedDays, onTargetDays, interactionCount }) {
  const score = loggedDays * 2 + onTargetDays * 2 + interactionCount;
  if (score >= 24) return "strong";
  if (score >= 18) return "glow";
  if (score >= 12) return "active";
  if (score >= 6) return "ready";
  return "cozy";
}

export function buildAnalyticsSnapshot(db) {
  const counts = {};

  for (const event of db.analyticsEvents) {
    counts[event.name] = (counts[event.name] || 0) + 1;
  }

  return {
    analyticsId: db.analyticsId,
    counts,
    eventCount: db.analyticsEvents.length,
    experiments: db.experiments,
    firstEventAt: db.analyticsEvents[0]?.createdAtUtc || null,
    lastEventAt: db.analyticsEvents.at(-1)?.createdAtUtc || null,
  };
}

export function listRecentDailySummaries(db, days) {
  const summaries = [];
  const today = formatLocalDate(new Date(), db.profile.timezone);

  for (let offset = 0; offset < days; offset += 1) {
    const localDate = shiftLocalDate(today, -offset);
    summaries.push(getDailySummaryForDate(db, localDate));
  }

  return summaries;
}

export function buildTodayResponse(db) {
  const today = formatLocalDate(new Date(), db.profile.timezone);
  const meals = db.intakeEntries.filter((entry) => entry.localDate === today);
  const exercises = db.exerciseEntries.filter((entry) => entry.localDate === today);
  const todaySummary = getDailySummaryForDate(db, today);
  const summaries = listRecentDailySummaries(db, 7);
  const interactionCount = db.analyticsEvents.filter((event) => event.name === "companion_tapped")
    .length;
  const loggedDays = summaries.filter((summary) => summary.mealCount > 0 || summary.exerciseCount > 0)
    .length;
  const onTargetDays = summaries.filter(
    (summary) =>
      summary.netCalories >= summary.targetCalories * 0.9 &&
      summary.netCalories <= summary.targetCalories * 1.1,
  ).length;

  return {
    companion: {
      interactionCount,
      loggedDays,
      onTargetDays,
      progressState: deriveCompanionProgressState({
        loggedDays,
        onTargetDays,
        interactionCount,
      }),
    },
    dataSource: "remote-api",
    exercises,
    experiments: db.experiments,
    lastDeletedEntry: db.lastDeletedEntry,
    meals,
    profile: db.profile,
    summary: {
      consumed: todaySummary.totalIntakeCalories,
      exerciseBurned: todaySummary.totalExerciseCalories,
      netCalories: todaySummary.netCalories,
      percentageUsed: Math.min(
        (Math.max(todaySummary.netCalories, 0) / db.profile.dailyCalorieTarget) * 100,
        100,
      ),
      remainingCalories: todaySummary.remainingCalories,
    },
  };
}

export function createAnalyticsEvent(name, payload = undefined) {
  return {
    id: `${name}-${Date.now()}`,
    name,
    createdAtUtc: new Date().toISOString(),
    payload,
  };
}
