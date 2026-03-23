import { Hono } from "hono";
import { fetchModels } from "../services/ollama.js";

const app = new Hono();

app.get("/models", async (c) => {
  try {
    const data = await fetchModels();
    return c.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message, models: [] }, 502);
  }
});

export default app;
