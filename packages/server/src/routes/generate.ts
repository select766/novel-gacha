import { Hono } from "hono";
import { ulid } from "ulid";
import { getDb } from "../db.js";
import { generationQueue } from "../services/queue.js";
import type {
  GenerateRequest,
  GenerateResponse,
  GenerationStatusResponse,
  GenerationGroup,
} from "@novel-gacha/shared";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json<GenerateRequest>();
  const db = getDb();
  const now = new Date().toISOString();

  let groupId: string;

  if (body.groupId) {
    // Add to existing group
    const existing = db
      .prepare("SELECT id FROM generation_groups WHERE id = ?")
      .get(body.groupId) as Pick<GenerationGroup, "id"> | undefined;
    if (!existing) {
      return c.json({ error: "Group not found" }, 404);
    }
    groupId = body.groupId;
  } else {
    // Create new group
    groupId = ulid();
    const title =
      body.title?.trim() ||
      `無題 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`;

    db.prepare(
      `INSERT INTO generation_groups
        (id, title, model_name, prompt, system_prompt, max_tokens, temperature, top_p, extra_params, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      groupId,
      title,
      body.model_name,
      body.prompt,
      body.system_prompt ?? null,
      body.max_tokens,
      body.temperature ?? null,
      body.top_p ?? null,
      body.extra_params ? JSON.stringify(body.extra_params) : null,
      now,
      now
    );
  }

  // Create novel rows
  const count = Math.min(Math.max(body.count || 1, 1), 100);
  const novelIds: string[] = [];
  const insertNovel = db.prepare(
    `INSERT INTO novels (id, group_id, status, created_at) VALUES (?, ?, 'pending', ?)`
  );

  const insertMany = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const novelId = ulid();
      insertNovel.run(novelId, groupId, now);
      novelIds.push(novelId);
    }
  });
  insertMany();

  // Enqueue for generation
  generationQueue.enqueue(novelIds);

  return c.json({ groupId, novelIds } as GenerateResponse, 201);
});

app.get("/status", (c) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT n.id as novelId, n.group_id as groupId, g.title as groupTitle, n.status
       FROM novels n
       JOIN generation_groups g ON g.id = n.group_id
       WHERE n.status IN ('pending', 'generating')
       ORDER BY n.created_at ASC`
    )
    .all() as GenerationStatusResponse["active"];
  return c.json({ active: rows } as GenerationStatusResponse);
});

export default app;
