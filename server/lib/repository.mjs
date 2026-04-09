import { createMockRepository } from "./mock-repository.mjs";
import { createPostgresRepository } from "./postgres-repository.mjs";

function readBooleanEnv(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return value === "1";
}

export function getServerConfig() {
  return {
    allowUserOverride: readBooleanEnv("CALORIE_APP_ALLOW_USER_OVERRIDE", true),
    dataFile: process.env.CALORIE_APP_DATA_FILE,
    databaseUrl: process.env.CALORIE_APP_DATABASE_URL || process.env.SUPABASE_DB_URL || null,
    defaultUserId: process.env.CALORIE_APP_USER_ID || process.env.SUPABASE_USER_ID || null,
    enableDevBearerAuth: readBooleanEnv("CALORIE_APP_ENABLE_DEV_BEARER_AUTH", false),
    port: Number(process.env.PORT || 8787),
    repository: process.env.CALORIE_APP_REPOSITORY === "postgres" ? "postgres" : "mock",
  };
}

function readHeaderUserId(config, request) {
  const headerValue = request?.headers?.["x-calorie-app-user-id"];
  if (typeof headerValue !== "string" || !config.allowUserOverride) {
    return null;
  }

  const trimmed = headerValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readDevBearerUserId(config, request) {
  if (!config.enableDevBearerAuth) {
    return null;
  }

  const authorization = request?.headers?.authorization;
  if (typeof authorization !== "string") {
    return null;
  }

  const match = authorization.match(/^Bearer\s+dev-user:(.+)$/i);
  if (!match) {
    return null;
  }

  const trimmed = match[1].trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveUserContext(config, request) {
  const headerUserId = readHeaderUserId(config, request);
  if (headerUserId) {
    return {
      source: "header-override",
      userId: headerUserId,
    };
  }

  const bearerUserId = readDevBearerUserId(config, request);
  if (bearerUserId) {
    return {
      source: "dev-bearer",
      userId: bearerUserId,
    };
  }

  if (config.defaultUserId) {
    return {
      source: "configured-default",
      userId: config.defaultUserId,
    };
  }

  return {
    source: "none",
    userId: null,
  };
}

export function resolveUserId(config, request) {
  return resolveUserContext(config, request).userId;
}

export function createRepository(config = getServerConfig(), overrides = {}) {
  const userId = overrides.userId || config.defaultUserId || null;

  if (config.repository === "postgres") {
    return createPostgresRepository({
      allowUserOverride: config.allowUserOverride,
      connectionString: config.databaseUrl,
      enableDevBearerAuth: config.enableDevBearerAuth,
      userId,
    });
  }

  return createMockRepository({
    allowUserOverride: config.allowUserOverride,
    dataFile: config.dataFile,
    enableDevBearerAuth: config.enableDevBearerAuth,
    userId,
  });
}
