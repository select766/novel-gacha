import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, setDb, getDb, closeDb } from "../db.js";
import { generationQueue } from "../services/queue.js";
import app from "../app.js";

function req(path: string, init?: RequestInit) {
  return app.request(path, init);
}

function json(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

beforeEach(() => {
  generationQueue.reset();
  setDb(createTestDb());
});

afterEach(() => {
  generationQueue.clear();
  closeDb();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await req("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("Settings API", () => {
  it("GET /api/settings returns default ollamaUrl", async () => {
    const res = await req("/api/settings");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ollamaUrl).toBe("http://localhost:11434");
  });

  it("PUT /api/settings updates ollamaUrl", async () => {
    const res = await req("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ollamaUrl: "http://example.com:11434" }),
    });
    expect(res.status).toBe(200);

    const res2 = await req("/api/settings");
    const data = await res2.json();
    expect(data.ollamaUrl).toBe("http://example.com:11434");
  });
});

describe("Groups API", () => {
  it("GET /api/groups returns empty list initially", async () => {
    const res = await req("/api/groups");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.groups).toEqual([]);
  });

  it("GET /api/groups/:id returns 404 for unknown group", async () => {
    const res = await req("/api/groups/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("Generate API", () => {
  it("POST /api/generate creates group and novels", async () => {
    const res = await req(
      "/api/generate",
      json({
        title: "テストタイトル",
        model_name: "test-model",
        prompt: "テストプロンプト",
        max_tokens: 100,
        count: 3,
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.groupId).toBeTruthy();
    expect(data.novelIds).toHaveLength(3);

    // Check group was created
    const groupRes = await req(`/api/groups/${data.groupId}`);
    expect(groupRes.status).toBe(200);
    const group = await groupRes.json();
    expect(group.title).toBe("テストタイトル");
    expect(group.model_name).toBe("test-model");
    expect(group.prompt).toBe("テストプロンプト");
    expect(group.novels).toHaveLength(3);
    expect(group.novels[0].status).toMatch(/pending|generating|failed/);
  });

  it("POST /api/generate with empty title auto-generates title", async () => {
    const res = await req(
      "/api/generate",
      json({
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 1,
      })
    );
    const data = await res.json();
    const groupRes = await req(`/api/groups/${data.groupId}`);
    const group = await groupRes.json();
    expect(group.title).toMatch(/^無題/);
  });

  it("POST /api/generate with groupId adds to existing group", async () => {
    // Create initial group
    const res1 = await req(
      "/api/generate",
      json({
        title: "グループ追加テスト",
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 2,
      })
    );
    const data1 = await res1.json();

    // Add more to same group
    const res2 = await req(
      "/api/generate",
      json({
        groupId: data1.groupId,
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 3,
      })
    );
    expect(res2.status).toBe(201);
    const data2 = await res2.json();
    expect(data2.groupId).toBe(data1.groupId);
    expect(data2.novelIds).toHaveLength(3);

    // Check total novels in group
    const groupRes = await req(`/api/groups/${data1.groupId}`);
    const group = await groupRes.json();
    expect(group.novels).toHaveLength(5);
  });

  it("POST /api/generate with invalid groupId returns 404", async () => {
    const res = await req(
      "/api/generate",
      json({
        groupId: "nonexistent",
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 1,
      })
    );
    expect(res.status).toBe(404);
  });

  it("GET /api/generate/status returns pending novels", async () => {
    await req(
      "/api/generate",
      json({
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 2,
      })
    );

    const res = await req("/api/generate/status");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.active.length).toBeGreaterThanOrEqual(2);
    expect(data.active[0].status).toMatch(/pending|generating/);
  });
});

describe("Novels API", () => {
  async function createNovel() {
    const res = await req(
      "/api/generate",
      json({
        title: "テスト",
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 1,
      })
    );
    const data = await res.json();
    return { groupId: data.groupId, novelId: data.novelIds[0] };
  }

  it("GET /api/novels/:id returns novel with group info", async () => {
    const { novelId } = await createNovel();
    const res = await req(`/api/novels/${novelId}`);
    expect(res.status).toBe(200);
    const novel = await res.json();
    expect(novel.id).toBe(novelId);
    expect(novel.group).toBeTruthy();
    expect(novel.group.model_name).toBe("test-model");
  });

  it("GET /api/novels/:id returns 404 for unknown novel", async () => {
    const res = await req("/api/novels/nonexistent");
    expect(res.status).toBe(404);
  });

  it("PATCH /api/novels/:id updates rating", async () => {
    const { novelId } = await createNovel();
    const res = await req(`/api/novels/${novelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4 }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.rating).toBe(4);
  });

  it("PATCH /api/novels/:id updates comment", async () => {
    const { novelId } = await createNovel();
    const res = await req(`/api/novels/${novelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: "面白い！" }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.comment).toBe("面白い！");
  });

  it("PATCH /api/novels/:id clears rating with null", async () => {
    const { novelId } = await createNovel();
    // Set rating
    await req(`/api/novels/${novelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5 }),
    });
    // Clear rating
    const res = await req(`/api/novels/${novelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: null }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.rating).toBeNull();
  });

  it("DELETE /api/novels/:id deletes novel", async () => {
    const { novelId } = await createNovel();
    const res = await req(`/api/novels/${novelId}`, { method: "DELETE" });
    expect(res.status).toBe(200);

    const res2 = await req(`/api/novels/${novelId}`);
    expect(res2.status).toBe(404);
  });

  it("DELETE /api/novels/:id returns 404 for unknown novel", async () => {
    const res = await req("/api/novels/nonexistent", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

describe("Groups list with aggregation", () => {
  it("returns novel counts and avg_rating", async () => {
    // Create group with novels
    const res = await req(
      "/api/generate",
      json({
        title: "集計テスト",
        model_name: "test-model",
        prompt: "テスト",
        max_tokens: 100,
        count: 3,
      })
    );
    const { groupId, novelIds } = await res.json();

    // Manually mark some novels as completed and rate them
    const db = getDb();
    db.prepare(
      "UPDATE novels SET status = 'completed', content = 'テスト内容' WHERE id = ?"
    ).run(novelIds[0]);
    db.prepare(
      "UPDATE novels SET status = 'completed', content = 'テスト内容' WHERE id = ?"
    ).run(novelIds[1]);
    db.prepare("UPDATE novels SET rating = 4 WHERE id = ?").run(novelIds[0]);
    db.prepare("UPDATE novels SET rating = 2 WHERE id = ?").run(novelIds[1]);

    const groupsRes = await req("/api/groups");
    const data = await groupsRes.json();
    const group = data.groups.find((g: { id: string }) => g.id === groupId);

    expect(group).toBeTruthy();
    expect(group.novel_count).toBe(3);
    expect(group.completed_count).toBe(2);
    expect(group.avg_rating).toBe(3); // (4+2)/2
  });
});
