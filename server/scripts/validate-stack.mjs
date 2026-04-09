import { spawn } from "node:child_process";

const baseUrl = process.env.CALORIE_APP_BASE_URL || "http://127.0.0.1:8787/api";
const smokeBearerToken = process.env.CALORIE_APP_SMOKE_BEARER_TOKEN?.trim() || "";
const smokeUserId = process.env.CALORIE_APP_SMOKE_USER_ID?.trim() || "";
const requestHeaders = {
  ...(smokeBearerToken ? { Authorization: `Bearer ${smokeBearerToken}` } : {}),
  ...(smokeUserId ? { "X-Calorie-App-User-Id": smokeUserId } : {}),
};
const endpoints = [
  { label: "health", path: "/health" },
  { label: "profile", path: "/profile" },
  { label: "today", path: "/today" },
  { label: "history", path: "/history?days=3" },
  { label: "logging_quick", path: "/logging/quick" },
  { label: "summary_diagnostics", path: "/summary/diagnostics" },
  { label: "pattern_diagnostics", path: "/patterns/diagnostics" },
];

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForApi(url, headers) {
  const timeoutMs = 10_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        return true;
      }
    } catch {
      // keep polling until timeout
    }
    await delay(250);
  }

  return false;
}

async function runSmoke() {
  const results = [];

  for (const endpoint of endpoints) {
    const startedAt = Date.now();

    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        headers: requestHeaders,
      });
      const text = await response.text();
      let body = null;

      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      results.push({
        durationMs: Date.now() - startedAt,
        label: endpoint.label,
        ok: response.ok,
        requestId: response.headers.get("x-request-id"),
        status: response.status,
        summary:
          typeof body === "object" && body
            ? Object.keys(body).slice(0, 6)
            : typeof body === "string"
              ? body.slice(0, 120)
              : null,
      });
    } catch (error) {
      results.push({
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown error",
        label: endpoint.label,
        ok: false,
        requestId: null,
        status: null,
        summary: null,
      });
    }
  }

  return results;
}

const child = spawn("node", ["server/index.mjs"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (chunk) => {
  stdout += chunk.toString("utf8");
});

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString("utf8");
});

console.log(
  JSON.stringify(
    {
      action: "validate-stack",
      baseUrl,
      repository: process.env.CALORIE_APP_REPOSITORY || "mock",
      smokeBearerTokenConfigured: Boolean(smokeBearerToken),
      smokeUserId: smokeUserId || null,
    },
    null,
    2,
  ),
);

try {
  const ready = await waitForApi(`${baseUrl}/health`, requestHeaders);
  if (!ready) {
    throw new Error("API did not become healthy before timeout.");
  }

  const results = await runSmoke();
  console.log(
    JSON.stringify(
      {
        baseUrl,
        results,
        smokeBearerTokenConfigured: Boolean(smokeBearerToken),
        smokeUserId: smokeUserId || null,
      },
      null,
      2,
    ),
  );

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  } else {
    console.log("Validate: stack looks healthy");
  }
} catch (error) {
  console.error(`Validate: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
} finally {
  child.kill("SIGTERM");
}
