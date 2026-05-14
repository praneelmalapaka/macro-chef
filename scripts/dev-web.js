const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");
const express = require("express");

const repoRoot = path.join(__dirname, "..");
const webRoot = path.join(repoRoot, "mobile", "build", "web");
const webPort = Number(process.env.WEB_PORT || 5103);
const webHost = process.env.WEB_HOST || "127.0.0.1";
const backendUrl = (process.env.API_BASE_URL || process.env.BACKEND_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const proxiedPrefixes = ["/auth", "/profile", "/users", "/friends", "/logs", "/recipes", "/health"];

let backendProcess = null;

async function backendIsHealthy() {
  try {
    const response = await fetch(`${backendUrl}/health`);
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function ensureBackend() {
  if (await backendIsHealthy()) {
    console.log(`[MacroChef] Backend already running at ${backendUrl}`);
    return;
  }

  console.log("[MacroChef] Starting backend dev server...");
  backendProcess = spawn("npm", ["run", "dev"], {
    cwd: path.join(repoRoot, "backend"),
    stdio: "inherit",
    shell: true
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(500);
    if (await backendIsHealthy()) return;
  }

  console.warn(`[MacroChef] Backend did not pass /health yet. The UI will still open and retry API calls against ${backendUrl}.`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: true,
      ...options
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function ensureFlutterWebBuild() {
  const indexPath = path.join(webRoot, "index.html");
  const shouldBuild = process.env.FORCE_WEB_BUILD === "true" || !fs.existsSync(indexPath);

  if (!shouldBuild) {
    console.log(`[MacroChef] Using Flutter web build at ${path.relative(repoRoot, webRoot)}`);
    return;
  }

  console.log("[MacroChef] Building Flutter web app...");
  await runCommand("npm", ["run", "web:build"], {
    env: {
      ...process.env,
      API_BASE_URL: backendUrl
    }
  });
}

function shouldProxy(pathname) {
  return proxiedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function proxyToBackend(req, res) {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      delete headers["content-length"];

      const response = await fetch(`${backendUrl}${req.originalUrl}`, {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : body
      });

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error(error);
      res.status(502).json({ error: "Backend unavailable." });
    }
  });
}

async function main() {
  await ensureBackend();
  await ensureFlutterWebBuild();

  const app = express();
  app.use((req, res, next) => {
    if (shouldProxy(req.path)) return proxyToBackend(req, res);
    return next();
  });
  app.use(express.static(webRoot, {
    extensions: ["html"],
    maxAge: "1h"
  }));
  app.use((_req, res) => res.sendFile(path.join(webRoot, "index.html")));

  const server = http.createServer(app);
  server.on("error", (error) => {
    console.error(`[MacroChef] Could not start web dev server on ${webHost}:${webPort}`);
    console.error(error);
    if (backendProcess) backendProcess.kill("SIGINT");
    process.exit(1);
  });

  server.listen(webPort, webHost, () => {
    const displayHost = webHost === "0.0.0.0" || webHost === "::" ? "localhost" : webHost;
    console.log(`[MacroChef] Flutter web dev app running at http://${displayHost}:${webPort}`);
    console.log(`[MacroChef] API proxy target: ${backendUrl}`);
  });

  const shutdown = () => {
    server.close();
    if (backendProcess) backendProcess.kill("SIGINT");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  if (backendProcess) backendProcess.kill("SIGINT");
  process.exit(1);
});
