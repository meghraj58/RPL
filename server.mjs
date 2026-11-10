import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(ROOT, "data", "players.json");
const PORT = Number(process.env.PORT) || 8080;
const MAX_BODY = 20 * 1024 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8"
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept"
};

async function readPlayers() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writePlayers(list) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, data) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...CORS
  });
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) {
      const error = new Error("body too large");
      error.code = "BODY_TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "");
  const resolved = path.resolve(ROOT, relative);
  const root = path.resolve(ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const route = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") {
      send(res, 204, "", CORS);
      return;
    }

    if (route === "/api/players") {
      if (req.method === "GET") {
        json(res, 200, await readPlayers());
        return;
      }
      if (req.method === "PUT") {
        const raw = await readBody(req);
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) {
          json(res, 400, { error: "Expected a player list." });
          return;
        }
        await writePlayers(list);
        json(res, 200, list);
        return;
      }
      json(res, 405, { error: "Method not allowed." });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method not allowed", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    let filePath = safeFile(route === "/" ? "/index.html" : route);
    if (!filePath) {
      send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    let stat;
    try {
      stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        stat = await fs.stat(filePath);
      }
    } catch (error) {
      send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const body = req.method === "HEAD" ? undefined : await fs.readFile(filePath);
    send(res, 200, body, {
      "Content-Type": type,
      "Cache-Control": ext === ".html" || ext === ".js" || ext === ".json" || ext === ".css" ? "no-store" : "public, max-age=86400"
    });
  } catch (error) {
    if (error.code === "BODY_TOO_LARGE") {
      json(res, 413, { error: "Upload is too large." });
      return;
    }
    if (error instanceof SyntaxError) {
      json(res, 400, { error: "Invalid JSON." });
      return;
    }
    send(res, 500, "Server error", { "Content-Type": "text/plain; charset=utf-8" });
  }
});

await writePlayers(await readPlayers());

server.listen(PORT, "0.0.0.0", () => {
  console.log("RPL Season 8 is running");
  console.log("This computer:  http://127.0.0.1:" + PORT + "/");
  console.log("Other devices:  http://<this-pc-ip>:" + PORT + "/");
});
