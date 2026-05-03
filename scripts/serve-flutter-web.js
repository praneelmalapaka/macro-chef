const express = require("express");
const http = require("http");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const webRoot = path.join(repoRoot, "mobile", "build", "web");
const port = Number(process.env.WEB_PORT || 5103);
const host = process.env.WEB_HOST || "127.0.0.1";

const app = express();

app.use(express.static(webRoot, {
  extensions: ["html"],
  maxAge: "1h"
}));

app.use((_req, res) => {
  res.sendFile(path.join(webRoot, "index.html"));
});

const server = http.createServer(app);
server.on("error", (error) => {
  console.error(`[MacroChef] Could not start built web server on ${host}:${port}`);
  console.error(error);
  process.exit(1);
});

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;
  console.log(`[MacroChef] Built Flutter web app running at http://${displayHost}:${port}`);
});
