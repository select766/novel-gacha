// === Database Entities ===

export interface GenerationGroup {
  id: string;
  title: string;
  model_name: string;
  prompt: string;
  system_prompt: string | null;
  max_tokens: number;
  temperature: number | null;
  top_p: number | null;
  extra_params: string | null;
  created_at: string;
  updated_at: string;
}

export type NovelStatus = "pending" | "generating" | "completed" | "failed";

export interface Novel {
  id: string;
  group_id: string;
  content: string | null;
  status: NovelStatus;
  error_message: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
  completed_at: string | null;
}

// === API Request Types ===

export interface GenerateRequest {
  groupId?: string;
  title?: string;
  model_name: string;
  prompt: string;
  system_prompt?: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  extra_params?: Record<string, unknown>;
  count: number;
}

export interface UpdateNovelRequest {
  rating?: number | null;
  comment?: string | null;
}

export interface UpdateSettingsRequest {
  ollamaUrl: string;
}

// === API Response Types ===

export interface GroupSummary {
  id: string;
  title: string;
  model_name: string;
  prompt: string;
  created_at: string;
  novel_count: number;
  completed_count: number;
  avg_rating: number | null;
}

export interface GroupDetail extends GenerationGroup {
  novels: Novel[];
}

export interface GenerateResponse {
  groupId: string;
  novelIds: string[];
}

export interface GenerationStatusItem {
  novelId: string;
  groupId: string;
  groupTitle: string;
  status: NovelStatus;
}

export interface GenerationStatusResponse {
  active: GenerationStatusItem[];
}

export interface NovelDetail extends Novel {
  group: GenerationGroup;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export interface AppSettings {
  ollamaUrl: string;
}
