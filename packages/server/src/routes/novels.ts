import { Hono } from "hono";
import { getDb } from "../db.js";
import type {
  NovelDetail,
  Novel,
  GenerationGroup,
  UpdateNovelRequest,
} from "@novel-gacha/shared";

const app = new Hono();

app.get("/:id", (c) => {
  const db = getDb();
  const novel = db
    .prepare("SELECT * FROM novels WHERE id = ?")
    .get(c.req.param("id")) as Novel | undefined;
  if (!novel) {
    return c.json({ error: "Novel not found" }, 404);
  }
  const group = db
    .prepare("SELECT * FROM generation_groups WHERE id = ?")
    .get(novel.group_id) as GenerationGroup;
  return c.json({ ...novel, group } as NovelDetail);
});

app.patch("/:id", async (c) => {
  const body = await c.req.json<UpdateNovelRequest>();
  const db = getDb();

  const novel = db
    .prepare("SELECT id FROM novels WHERE id = ?")
    .get(c.req.param("id"));
  if (!novel) {
    return c.json({ error: "Novel not found" }, 404);
  }

  if (body.rating !== undefined) {
    db.prepare("UPDATE novels SET rating = ? WHERE id = ?").run(
      body.rating,
      c.req.param("id")
    );
  }
  if (body.comment !== undefined) {
    db.prepare("UPDATE novels SET comment = ? WHERE id = ?").run(
      body.comment,
      c.req.param("id")
    );
  }

  const updated = db
    .prepare("SELECT * FROM novels WHERE id = ?")
    .get(c.req.param("id"));
  return c.json(updated);
});

app.delete("/:id", (c) => {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM novels WHERE id = ?")
    .run(c.req.param("id"));
  if (result.changes === 0) {
    return c.json({ error: "Novel not found" }, 404);
  }
  return c.json({ ok: true });
});

export default app;
