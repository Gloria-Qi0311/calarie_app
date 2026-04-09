import { createServer } from "node:http";
import { URL } from "node:url";
import { createAppService } from "./lib/app-service.mjs";
import { createRequestId, readBody, sendJson, sendNoContent } from "./lib/http.mjs";
import { createRepository, getServerConfig, resolveUserContext } from "./lib/repository.mjs";

const config = getServerConfig();

const server = createServer(async (request, response) => {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const userContext = resolveUserContext(config, request);
  const repository = createRepository(config, { userId: userContext.userId });
  repository.userContext = userContext;
  repository.ensure();
  const service = createAppService(repository);
  const responseHeaders = {
    "X-Request-Id": requestId,
  };

  function logRequest(statusCode, meta) {
    const durationMs = Date.now() - startedAt;
    const method = request.method ?? "UNKNOWN";
    const path = request.url ?? "/";
    console.log(
      JSON.stringify({
        durationMs,
        method,
        path,
        repository: repository.kind,
        userId: userContext.userId,
        userSource: userContext.source,
        requestId,
        statusCode,
        ...meta,
      }),
    );
  }

  if (!request.url || !request.method) {
    sendJson(response, 400, { error: "Invalid request", requestId }, { headers: responseHeaders });
    logRequest(400);
    return;
  }

  if (request.method === "OPTIONS") {
    sendNoContent(response, { headers: responseHeaders });
    logRequest(204);
    return;
  }

  const url = new URL(request.url, `http://localhost:${config.port}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, await service.getHealth(), { headers: responseHeaders });
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/session") {
      sendJson(response, 200, service.getSession(), { headers: responseHeaders });
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/profile") {
      sendJson(response, 200, await service.getProfileResponse(), { headers: responseHeaders });
      logRequest(200);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/profile") {
      sendJson(response, 200, await service.updateProfile(await readBody(request)), {
        headers: responseHeaders,
      });
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/today") {
      sendJson(response, 200, await service.getTodayResponse(), { headers: responseHeaders });
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/history") {
      const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days") || 7)));
      sendJson(response, 200, await service.getHistoryResponse(days), {
        headers: responseHeaders,
      });
      logRequest(200, { days });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/summary/diagnostics") {
      sendJson(
        response,
        200,
        {
          dataSource: "remote-api",
          repository: repository.kind,
          summaryDiagnostics: await service.getSummaryDiagnostics(),
        },
        { headers: responseHeaders },
      );
      logRequest(200);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/summary/recompute") {
      sendJson(
        response,
        200,
        {
          dataSource: "remote-api",
          repository: repository.kind,
          result: await service.recomputeDailySummaries(),
        },
        { headers: responseHeaders },
      );
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/patterns/diagnostics") {
      sendJson(
        response,
        200,
        {
          dataSource: "remote-api",
          patternDiagnostics: await service.getPatternDiagnostics(),
          repository: repository.kind,
        },
        { headers: responseHeaders },
      );
      logRequest(200);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/patterns/recompute") {
      sendJson(
        response,
        200,
        {
          dataSource: "remote-api",
          repository: repository.kind,
          result: await service.recomputePatternShortcuts(),
        },
        { headers: responseHeaders },
      );
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/recommendations") {
      sendJson(response, 200, await service.getRecommendationsResponse(), {
        headers: responseHeaders,
      });
      logRequest(200);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/logging/quick") {
      sendJson(response, 200, await service.getQuickLoggingResponse(), {
        headers: responseHeaders,
      });
      logRequest(200);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/intake") {
      sendJson(response, 200, await service.createIntake(await readBody(request)), {
        headers: responseHeaders,
      });
      logRequest(200);
      return;
    }

    const intakeMatch = url.pathname.match(/^\/api\/intake\/([^/]+)$/);
    if (intakeMatch && request.method === "PATCH") {
      const result = await service.updateIntake(intakeMatch[1], await readBody(request));
      if (!result) {
        sendJson(
          response,
          404,
          { error: "Intake entry not found", requestId },
          { headers: responseHeaders },
        );
        logRequest(404, { entryId: intakeMatch[1], entryType: "intake" });
        return;
      }
      sendJson(response, 200, result, { headers: responseHeaders });
      logRequest(200, { entryId: intakeMatch[1], entryType: "intake" });
      return;
    }

    if (intakeMatch && request.method === "DELETE") {
      const deleted = await service.deleteIntake(intakeMatch[1]);
      if (!deleted) {
        sendJson(
          response,
          404,
          { error: "Intake entry not found", requestId },
          { headers: responseHeaders },
        );
        logRequest(404, { entryId: intakeMatch[1], entryType: "intake" });
        return;
      }
      sendNoContent(response, { headers: responseHeaders });
      logRequest(204, { entryId: intakeMatch[1], entryType: "intake" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/exercise") {
      sendJson(response, 200, await service.createExercise(await readBody(request)), {
        headers: responseHeaders,
      });
      logRequest(200);
      return;
    }

    const exerciseMatch = url.pathname.match(/^\/api\/exercise\/([^/]+)$/);
    if (exerciseMatch && request.method === "PATCH") {
      const result = await service.updateExercise(exerciseMatch[1], await readBody(request));
      if (!result) {
        sendJson(
          response,
          404,
          { error: "Exercise entry not found", requestId },
          { headers: responseHeaders },
        );
        logRequest(404, { entryId: exerciseMatch[1], entryType: "exercise" });
        return;
      }
      sendJson(response, 200, result, { headers: responseHeaders });
      logRequest(200, { entryId: exerciseMatch[1], entryType: "exercise" });
      return;
    }

    if (exerciseMatch && request.method === "DELETE") {
      const deleted = await service.deleteExercise(exerciseMatch[1]);
      if (!deleted) {
        sendJson(
          response,
          404,
          { error: "Exercise entry not found", requestId },
          { headers: responseHeaders },
        );
        logRequest(404, { entryId: exerciseMatch[1], entryType: "exercise" });
        return;
      }
      sendNoContent(response, { headers: responseHeaders });
      logRequest(204, { entryId: exerciseMatch[1], entryType: "exercise" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/undo") {
      sendJson(response, 200, await service.restoreLastDeletedEntry(), {
        headers: responseHeaders,
      });
      logRequest(200);
      return;
    }

    if (request.method === "DELETE" && url.pathname === "/api/undo") {
      await service.clearLastDeletedEntry();
      sendNoContent(response, { headers: responseHeaders });
      logRequest(204);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/events") {
      const body = await readBody(request);
      await service.trackEvent(body.name, body.payload);
      sendNoContent(response, { headers: responseHeaders });
      logRequest(204, { eventName: body.name ?? null });
      return;
    }

    sendJson(response, 404, { error: "Not found", requestId }, { headers: responseHeaders });
    logRequest(404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number(error.statusCode) || 500
        : 500;
    console.error(
      JSON.stringify({
        error: message,
        method: request.method,
        path: request.url,
        repository: repository.kind,
        userId: userContext.userId,
        userSource: userContext.source,
        requestId,
      }),
    );
    sendJson(
      response,
      statusCode,
      {
        error: message,
        requestId,
      },
      { headers: responseHeaders },
    );
    logRequest(statusCode, { error: message });
  }
});

server.listen(config.port, () => {
  console.log(`Calorie app API running on http://127.0.0.1:${config.port}`);
  console.log(`Repository mode: ${config.repository}`);
  console.log(`User override enabled: ${config.allowUserOverride ? "yes" : "no"}`);
  console.log(`Dev bearer auth enabled: ${config.enableDevBearerAuth ? "yes" : "no"}`);
  if (config.repository === "mock") {
    const repository = createRepository(config, { userId: config.defaultUserId || "mock-user" });
    console.log(`Using data file: ${repository.dataFile}`);
  }
});
