import { createRepository, getServerConfig } from "../lib/repository.mjs";

export function readScriptTargetUserId() {
  const value = process.env.CALORIE_APP_TARGET_USER_ID;
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createScriptRepository(options = {}) {
  const config = getServerConfig();
  const repository = createRepository(
    {
      ...config,
      repository: options.repository ?? config.repository,
    },
    {
      userId: readScriptTargetUserId() || config.defaultUserId || null,
    },
  );

  return {
    config,
    repository,
    targetUserId: readScriptTargetUserId(),
  };
}
