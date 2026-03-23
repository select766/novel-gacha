import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import groupsRoutes from "./routes/groups.js";
import novelsRoutes from "./routes/novels.js";
import generateRoutes from "./routes/generate.js";
import ollamaRoutes from "./routes/ollama.js";
import settingsRoutes from "./routes/settings.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173"],
  })
);

app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/api/groups", groupsRoutes);
app.route("/api/novels", novelsRoutes);
app.route("/api/generate", generateRoutes);
app.route("/api/ollama", ollamaRoutes);
app.route("/api/settings", settingsRoutes);

export default app;
