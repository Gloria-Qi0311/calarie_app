import {
  buildAnalyticsSnapshot,
  buildTodayResponse,
  deriveMealPatternShortcuts,
  getMealSuggestions,
  listRecentDailySummaries,
} from "./domain.mjs";

export function createAppService(repository) {
  function getAuthMetadata() {
    const diagnostics = repository.getDiagnostics?.() ?? null;
    const effectiveUserId = diagnostics?.userId ?? null;
    return {
      allowUserOverride: Boolean(diagnostics?.allowUserOverride),
      devBearerEnabled: Boolean(diagnostics?.enableDevBearerAuth),
      effectiveUserId,
      source:
        repository.userContext?.source ??
        (effectiveUserId ? "configured-default" : "none"),
    };
  }

  return {
    async getHealth() {
      const diagnostics = repository.getDiagnostics?.() ?? null;
      const auth = getAuthMetadata();
      let summaryDiagnostics = null;
      let patternDiagnostics = null;

      try {
        summaryDiagnostics = repository.getSummaryDiagnostics
          ? await repository.getSummaryDiagnostics()
          : null;
      } catch (error) {
        summaryDiagnostics = {
          error: error instanceof Error ? error.message : "unknown error",
        };
      }

      try {
        patternDiagnostics = repository.getPatternDiagnostics
          ? await repository.getPatternDiagnostics()
          : null;
      } catch (error) {
        patternDiagnostics = {
          error: error instanceof Error ? error.message : "unknown error",
        };
      }

      return {
        connection: repository.probeConnection ? await repository.probeConnection() : null,
        dataSource: "remote-api",
        diagnostics,
        effectiveUserId: auth.effectiveUserId,
        auth,
        mode: repository.kind === "postgres" ? "postgres-server" : "mock-server",
        ok: true,
        repository: repository.kind,
        patternDiagnostics,
        summaryDiagnostics,
      };
    },

    getSession() {
      const auth = getAuthMetadata();
      return {
        authenticated: Boolean(auth.effectiveUserId),
        auth,
        effectiveUserId: auth.effectiveUserId,
        mode: repository.kind === "postgres" ? "postgres-server" : "mock-server",
      };
    },

    async getProfileResponse() {
      const db = await repository.getDb();
      return {
        analytics: buildAnalyticsSnapshot(db),
        dataSource: "remote-api",
        profile: db.profile,
      };
    },

    async updateProfile(input) {
      const profile = await repository.updateProfile(input);
      return { profile };
    },

    async getTodayResponse() {
      return buildTodayResponse(await repository.getDb());
    },

    async getHistoryResponse(days) {
      const db = await repository.getDb();
      return {
        dataSource: "remote-api",
        profile: db.profile,
        summaries: listRecentDailySummaries(db, days),
      };
    },

    async getRecommendationsResponse() {
      const db = await repository.getDb();
      const today = buildTodayResponse(db);
      return {
        dataSource: "remote-api",
        experiments: db.experiments,
        profile: db.profile,
        remainingCalories: today.summary.remainingCalories,
        suggestions: getMealSuggestions({
          remainingCalories: today.summary.remainingCalories,
          goalDirection: db.profile.goalDirection,
        }),
      };
    },

    async getQuickLoggingResponse() {
      const db = await repository.getDb();
      return {
        dataSource: "remote-api",
        patternShortcuts:
          db.patternShortcuts ||
          deriveMealPatternShortcuts(db.intakeEntries, {
            limit: 4,
            minCount: 2,
          }),
      };
    },

    async createIntake(input) {
      return { entry: await repository.createIntake(input) };
    },

    async updateIntake(entryId, updates) {
      const entry = await repository.updateIntake(entryId, updates);
      if (!entry) {
        return null;
      }
      return { entry };
    },

    async deleteIntake(entryId) {
      return repository.deleteIntake(entryId);
    },

    async createExercise(input) {
      return { entry: await repository.createExercise(input) };
    },

    async updateExercise(entryId, updates) {
      const entry = await repository.updateExercise(entryId, updates);
      if (!entry) {
        return null;
      }
      return { entry };
    },

    async deleteExercise(entryId) {
      return repository.deleteExercise(entryId);
    },

    async restoreLastDeletedEntry() {
      return { restored: await repository.restoreLastDeletedEntry() };
    },

    async clearLastDeletedEntry() {
      await repository.clearLastDeletedEntry();
    },

    async getSummaryDiagnostics() {
      if (!repository.getSummaryDiagnostics) {
        return null;
      }
      return repository.getSummaryDiagnostics();
    },

    async recomputeDailySummaries() {
      if (!repository.recomputeDailySummaries) {
        return null;
      }
      return repository.recomputeDailySummaries();
    },

    async getPatternDiagnostics() {
      if (!repository.getPatternDiagnostics) {
        return null;
      }
      return repository.getPatternDiagnostics();
    },

    async recomputePatternShortcuts() {
      if (!repository.recomputePatternShortcuts) {
        return null;
      }
      return repository.recomputePatternShortcuts();
    },

    async trackEvent(name, payload) {
      await repository.trackEvent(name, payload);
    },
  };
}
