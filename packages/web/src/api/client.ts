import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  GroupSummary,
  GroupDetail,
  NovelDetail,
  GenerateRequest,
  GenerateResponse,
  GenerationStatusResponse,
  OllamaModelsResponse,
  AppSettings,
  UpdateNovelRequest,
  UpdateSettingsRequest,
} from "@novel-gacha/shared";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API Error ${res.status}: ${body}`);
  }
  return res.json();
}

// Groups
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => api<{ groups: GroupSummary[] }>("/groups"),
    select: (data) => data.groups,
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => api<GroupDetail>(`/groups/${id}`),
    enabled: !!id,
  });
}

// Novels
export function useNovel(id: string) {
  return useQuery({
    queryKey: ["novels", id],
    queryFn: () => api<NovelDetail>(`/novels/${id}`),
    enabled: !!id,
  });
}

export function useUpdateNovel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNovelRequest }) =>
      api(`/novels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["novels", vars.id] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteNovel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/novels/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

// Generation
export function useGenerate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateRequest) =>
      api<GenerateResponse>("/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["generation-status"] });
    },
  });
}

export function useGenerationStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["generation-status"],
    queryFn: () => api<GenerationStatusResponse>("/generate/status"),
    refetchInterval: enabled ? 3000 : false,
  });
}

// Ollama
export function useOllamaModels() {
  return useQuery({
    queryKey: ["ollama-models"],
    queryFn: () => api<OllamaModelsResponse>("/ollama/models"),
    retry: false,
  });
}

// Settings
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api<AppSettings>("/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) =>
      api("/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
