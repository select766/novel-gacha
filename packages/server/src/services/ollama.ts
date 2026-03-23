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

  // /api/chat を使用（thinkingモデル対応）
  const messages: { role: string; content: string }[] = [];
  if (params.system) {
    messages.push({ role: "system", content: params.system });
  }
  messages.push({ role: "user", content: params.prompt });

  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      messages,
      stream: false,
      options: params.options,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama chat error: ${res.status} ${body}`);
  }

  const data = (await res.json()) as {
    message?: { content?: string; thinking?: string };
  };
  const content = data.message?.content || "";
  const thinking = data.message?.thinking || "";

  // thinkingモデルの場合、contentが空ならthinkingをフォールバックとして使用
  const response = content || thinking;

  return { response };
}
