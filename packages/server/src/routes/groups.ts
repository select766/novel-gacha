import { Hono } from "hono";
import { getDb } from "../db.js";
import type { GroupSummary, GroupDetail, Novel } from "@novel-gacha/shared";

const app = new Hono();

app.get("/", (c) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        g.id, g.title, g.model_name, g.prompt, g.created_at,
        COUNT(n.id) as novel_count,
        SUM(CASE WHEN n.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        AVG(CASE WHEN n.rating IS NOT NULL THEN n.rating END) as avg_rating
      FROM generation_groups g
      LEFT JOIN novels n ON n.group_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at DESC`
    )
    .all() as GroupSummary[];
  return c.json({ groups: rows });
});

app.get("/:id", (c) => {
  const db = getDb();
  const group = db
    .prepare("SELECT * FROM generation_groups WHERE id = ?")
    .get(c.req.param("id"));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  const novels = db
    .prepare(
      "SELECT * FROM novels WHERE group_id = ? ORDER BY created_at DESC"
    )
    .all(c.req.param("id")) as Novel[];
  return c.json({ ...group, novels } as GroupDetail);
});

export default app;
