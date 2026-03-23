import { Hono } from "hono";
import { getDb } from "../db.js";
import type { AppSettings, UpdateSettingsRequest } from "@novel-gacha/shared";

const app = new Hono();

app.get("/", (c) => {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM app_settings").all() as {
    key: string;
    value: string;
  }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return c.json(settings as AppSettings);
});

app.put("/", async (c) => {
  const body = await c.req.json<UpdateSettingsRequest>();
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)"
  ).run("ollamaUrl", body.ollamaUrl);
  return c.json({ ok: true });
});

export default app;
