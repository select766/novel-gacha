import { getDb } from "../db.js";

function getOllamaUrl(): string {
  const row = getDb()
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get("ollamaUrl") as { value: string } | undefined;
  return row?.value ?? "http://localhost:11434";
}

export async function fetchModels(): Promise<unknown> {
  const url = getOllamaUrl();
  const res = await fetch(`${url}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface OllamaGenerateParams {
  model: string;
  prompt: string;
  system?: string;
  options?: {
    num_predict?: number;
    temperature?: number;
    top_p?: number;
    [key: string]: unknown;
  };
}

export interface OllamaGenerateResult {
  response: string;
}

export async function generateText(
  params: OllamaGenerateParams
): Promise<OllamaGenerateResult> {
  const url = getOllamaUrl();
  const res = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...params,
      stream: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama generate error: ${res.status} ${body}`);
  }
  return res.json() as Promise<OllamaGenerateResult>;
}
