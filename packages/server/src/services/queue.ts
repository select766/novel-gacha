import { getDb } from "../db.js";
import { generateText } from "./ollama.js";
import type { Novel, GenerationGroup } from "@novel-gacha/shared";

class GenerationQueue {
  private queue: string[] = [];
  private processing = false;

  enqueue(novelIds: string[]): void {
    this.queue.push(...novelIds);
    this.processNext();
  }

  restorePending(): void {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT id FROM novels WHERE status IN ('pending', 'generating') ORDER BY created_at ASC"
      )
      .all() as Pick<Novel, "id">[];

    // Reset any 'generating' back to 'pending' (server restarted mid-generation)
    db.prepare(
      "UPDATE novels SET status = 'pending' WHERE status = 'generating'"
    ).run();

    if (rows.length > 0) {
      console.log(`Restoring ${rows.length} pending novel(s) to queue`);
      this.queue.push(...rows.map((r) => r.id));
      this.processNext();
    }
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const novelId = this.queue.shift()!;

    try {
      const db = getDb();

      const novel = db
        .prepare("SELECT * FROM novels WHERE id = ?")
        .get(novelId) as Novel | undefined;

      if (!novel || novel.status === "completed" || novel.status === "failed") {
        this.processing = false;
        this.processNext();
        return;
      }

      const group = db
        .prepare("SELECT * FROM generation_groups WHERE id = ?")
        .get(novel.group_id) as GenerationGroup | undefined;

      if (!group) {
        db.prepare(
          "UPDATE novels SET status = 'failed', error_message = ? WHERE id = ?"
        ).run("Generation group not found", novelId);
        this.processing = false;
        this.processNext();
        return;
      }

      // Mark as generating
      db.prepare("UPDATE novels SET status = 'generating' WHERE id = ?").run(
        novelId
      );

      // Build Ollama params
      const extraParams = group.extra_params
        ? JSON.parse(group.extra_params)
        : {};
      const options: Record<string, unknown> = {
        num_predict: group.max_tokens,
        ...extraParams,
      };
      if (group.temperature != null) options.temperature = group.temperature;
      if (group.top_p != null) options.top_p = group.top_p;

      const result = await generateText({
        model: group.model_name,
        prompt: group.prompt,
        system: group.system_prompt ?? undefined,
        options,
      });

      // Save result
      db.prepare(
        "UPDATE novels SET content = ?, status = 'completed', completed_at = ? WHERE id = ?"
      ).run(result.response, new Date().toISOString(), novelId);

      console.log(`Novel ${novelId} completed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Novel ${novelId} failed:`, message);
      getDb()
        .prepare(
          "UPDATE novels SET status = 'failed', error_message = ? WHERE id = ?"
        )
        .run(message, novelId);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

export const generationQueue = new GenerationQueue();
