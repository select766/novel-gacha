import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, setDb, getDb, closeDb } from "../db.js";
import app from "../app.js";
import { generationQueue } from "../services/queue.js";
import type { Novel } from "@novel-gacha/shared";

/**
 * Ollama統合テスト
 * 実際のOllama (qwen3.5:9b) を使用してE2E生成をテスト
 * Ollamaが起動していない場合はスキップされる
 */

const OLLAMA_URL = "http://localhost:11434";
const MODEL = "qwen3.5:9b";

async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

function req(path: string, init?: RequestInit) {
  return app.request(path, init);
}

describe("Ollama Integration", () => {
  let available = false;

  beforeEach(async () => {
    available = await isOllamaAvailable();
    generationQueue.reset();
    setDb(createTestDb());
  });

  afterEach(() => {
    generationQueue.clear();
    closeDb();
  });

  it("GET /api/ollama/models returns model list", async () => {
    if (!available) {
      console.log("Ollama not available, skipping");
      return;
    }

    const res = await req("/api/ollama/models");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.models).toBeDefined();
    expect(Array.isArray(data.models)).toBe(true);

    // qwen3.5:9b should be in the list
    const modelNames = data.models.map((m: { name: string }) => m.name);
    expect(modelNames.some((n: string) => n.includes("qwen3"))).toBe(true);
  });

  it("generates a novel via queue with qwen3.5:9b", { timeout: 180_000 }, async () => {
      if (!available) {
        console.log("Ollama not available, skipping");
        return;
      }

      // Create a generation request
      const res = await req("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "統合テスト小説",
          model_name: MODEL,
          prompt:
            "むかしむかし、ある所におじいさんとおばあさんが住んでいました。続きを100文字程度で書いてください。",
          max_tokens: 256,
          temperature: 0.8,
          count: 1,
        }),
      });
      expect(res.status).toBe(201);
      const { groupId, novelIds } = await res.json();
      expect(novelIds).toHaveLength(1);
      const novelId = novelIds[0];

      // Wait for generation to complete (poll)
      const maxWait = 120_000; // 2 minutes
      const interval = 2000;
      let elapsed = 0;
      let novel: Novel | undefined;

      while (elapsed < maxWait) {
        await new Promise((r) => setTimeout(r, interval));
        elapsed += interval;

        novel = getDb()
          .prepare("SELECT * FROM novels WHERE id = ?")
          .get(novelId) as Novel | undefined;

        if (novel && (novel.status === "completed" || novel.status === "failed")) {
          break;
        }
      }

      expect(novel).toBeDefined();
      expect(novel!.status).toBe("completed");
      expect(novel!.content).toBeTruthy();
      expect(novel!.content!.length).toBeGreaterThan(10);
      expect(novel!.completed_at).toBeTruthy();

      console.log("Generated content:", novel!.content!.slice(0, 200));

      // Verify via API
      const novelRes = await req(`/api/novels/${novelId}`);
      expect(novelRes.status).toBe(200);
      const novelData = await novelRes.json();
      expect(novelData.status).toBe("completed");
      expect(novelData.content).toBeTruthy();
      expect(novelData.group.title).toBe("統合テスト小説");

      // Verify group listing shows completed
      const groupsRes = await req("/api/groups");
      const groupsData = await groupsRes.json();
      const group = groupsData.groups.find(
        (g: { id: string }) => g.id === groupId
      );
      expect(group).toBeTruthy();
      expect(group.completed_count).toBe(1);
    });
});
